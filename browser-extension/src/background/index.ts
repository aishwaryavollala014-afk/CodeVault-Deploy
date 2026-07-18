import type { AuthStatus, ExtMessage, HealthState, IngestResponse, RecentResponse } from '../types';
import { getRecentProblems, postIngest } from '../lib/api-client';
import { clearToken, getToken, setToken } from '../lib/storage';

// MV3 service worker. The sole holder of the JWT — content scripts/popup message here,
// and only this worker talks to git-service /api/ingest.

// ── Health monitor constants ──────────────────────────────────────────────────
// If no successful capture has been recorded for more than STALE_THRESHOLD_MS,
// the extension badge turns red (degraded). Checks run every HEALTH_ALARM_PERIOD_MIN.
const HEALTH_ALARM_NAME       = 'cv-health-check';
const HEALTH_ALARM_PERIOD_MIN = 30;          // check interval
const STALE_THRESHOLD_MS      = 60 * 60 * 1000; // 1 h without a capture → degraded

const PLATFORM_URLS = [
  'https://leetcode.com/*',
  'https://codeforces.com/*',
  'https://www.codechef.com/*',
  'https://www.hackerrank.com/*',
];

// ── Badge helpers ─────────────────────────────────────────────────────────────
function setBadgeGreen(): void {
  chrome.action.setBadgeBackgroundColor({ color: '#16a34a' });
  chrome.action.setBadgeText({ text: '✓' });
}
function setBadgeRed(): void {
  chrome.action.setBadgeBackgroundColor({ color: '#dc2626' });
  chrome.action.setBadgeText({ text: '!' });
}
function clearBadge(): void {
  chrome.action.setBadgeText({ text: '' });
}

// ── Health state persistence ──────────────────────────────────────────────────
async function getHealth(): Promise<HealthState> {
  const stored = await chrome.storage.local.get('cvHealth');
  return (stored.cvHealth as HealthState | undefined) ?? { status: 'unknown' };
}
async function setHealth(state: HealthState): Promise<void> {
  await chrome.storage.local.set({ cvHealth: state });
}

/** Called every time a capture succeeds — resets degraded state. */
async function recordCaptureSuccess(platform: string): Promise<void> {
  const state: HealthState = {
    status: 'ok',
    lastCaptureAt: new Date().toISOString(),
    lastCheckedAt: new Date().toISOString(),
  };
  await setHealth(state);
  setBadgeGreen();
  // Auto-clear the green badge after 8 s so it doesn't clutter the toolbar
  setTimeout(() => clearBadge(), 8000);
  console.info(`[CodeVault] Health: capture success on ${platform} — badge set to green`);
}

/** Alarm handler: runs every HEALTH_ALARM_PERIOD_MIN minutes. */
async function runHealthCheck(): Promise<void> {
  const state = await getHealth();
  const now = Date.now();
  const checkedAt = new Date().toISOString();

  let newStatus = state.status;
  if (state.lastCaptureAt) {
    const age = now - new Date(state.lastCaptureAt).getTime();
    newStatus = age > STALE_THRESHOLD_MS ? 'degraded' : 'ok';
  } else {
    // Never captured — only mark degraded if the extension has been installed > 1 h
    // (give the user time to solve their first problem)
    newStatus = 'unknown';
  }

  await setHealth({ ...state, status: newStatus, lastCheckedAt: checkedAt });

  if (newStatus === 'degraded') {
    setBadgeRed();
    console.warn('[CodeVault] Health: no capture in >1h — badge set to red');
  } else {
    clearBadge();
  }
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async () => {
  try {
    // Create (or replace) the recurring health-check alarm
    await chrome.alarms.clear(HEALTH_ALARM_NAME);
    chrome.alarms.create(HEALTH_ALARM_NAME, { periodInMinutes: HEALTH_ALARM_PERIOD_MIN });
    console.info(`[CodeVault] Health alarm scheduled every ${HEALTH_ALARM_PERIOD_MIN} min`);

    // Reload any already-open platform tabs so fresh content scripts inject
    // (prevents the "capture didn't fire" bug after every extension rebuild)
    const tabs = await chrome.tabs.query({ url: PLATFORM_URLS });
    for (const t of tabs) if (t.id) chrome.tabs.reload(t.id);
  } catch {
    /* no tabs permission for some tab / ignore */
  }
});

// Also register the alarm on service-worker startup (MV3 workers restart frequently)
chrome.alarms.create(HEALTH_ALARM_NAME, { periodInMinutes: HEALTH_ALARM_PERIOD_MIN });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === HEALTH_ALARM_NAME) {
    runHealthCheck().catch((e) => console.error('[CodeVault] Health check failed', e));
  }
});

// ── Message router ─────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener(
  (msg: ExtMessage, sender, sendResponse: (res: IngestResponse | AuthStatus | RecentResponse | HealthState) => void) => {
    switch (msg?.type) {
      case 'capture': {
        if (!sender.tab || !sender.url) {
          sendResponse({ ok: false, error: 'invalid_sender' });
          return false;
        }
        postIngest([msg.submission])
          .then((res) => sendResponse(res))
          .catch((err) =>
            sendResponse({ ok: false, error: err instanceof Error ? err.message : 'unknown' }),
          );
        return true; // async
      }

      case 'captureSuccess': {
        // Content scripts notify us on every successful sendCapture() so we can
        // update the health state without needing to wait for the next alarm.
        recordCaptureSuccess(msg.platform).catch(() => {});
        return false;
      }

      case 'getHealth': {
        getHealth()
          .then((state) => sendResponse(state))
          .catch(() => sendResponse({ status: 'unknown' }));
        return true;
      }

      case 'setToken': {
        // Only accept the token from the CodeVault web app origin.
        const fromApp = sender.url?.startsWith('http://localhost:3000') ?? false;
        if (!fromApp) {
          sendResponse({ ok: false, error: 'untrusted_origin' });
          return false;
        }
        setToken(msg.token)
          .then(async () => {
            // If this JWT arrived from the tab the popup opened for sign-in, auto-close it so
            // the user lands back on their coding tab instead of a stray CodeVault page.
            try {
              const { cvLoginTabId } = await chrome.storage.local.get('cvLoginTabId');
              if (cvLoginTabId != null && sender.tab?.id === cvLoginTabId) {
                await chrome.storage.local.remove('cvLoginTabId');
                await chrome.tabs.remove(cvLoginTabId);
              }
            } catch {
              /* tab already closed / no tabs permission — ignore */
            }
            sendResponse({ ok: true });
          })
          .catch(() => sendResponse({ ok: false, error: 'store_failed' }));
        return true;
      }

      case 'signOut': {
        clearToken()
          .then(() => sendResponse({ ok: true }))
          .catch(() => sendResponse({ ok: false }));
        return true;
      }

      case 'getStatus': {
        getToken()
          .then((t) => sendResponse({ signedIn: !!t }))
          .catch(() => sendResponse({ signedIn: false }));
        return true;
      }

      case 'getRecent': {
        getRecentProblems(6)
          .then((res) => sendResponse(res))
          .catch((err) =>
            sendResponse({ ok: false, error: err instanceof Error ? err.message : 'unknown' }),
          );
        return true; // async
      }

      default:
        return false;
    }
  },
);
