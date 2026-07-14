import type { AuthStatus, ExtMessage, IngestResponse, RecentResponse } from '../types';
import { getRecentProblems, postIngest } from '../lib/api-client';
import { clearToken, getToken, setToken } from '../lib/storage';

// MV3 service worker. The sole holder of the JWT — content scripts/popup message here,
// and only this worker talks to git-service /api/ingest.

// Content scripts only inject on a page LOAD. A LeetCode tab that was already open when the
// extension is installed/updated/reloaded has no capture script — reload those tabs once so
// the fresh scripts inject. This removes the need to manually hard-refresh.
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const tabs = await chrome.tabs.query({ url: 'https://leetcode.com/*' });
    for (const t of tabs) if (t.id) chrome.tabs.reload(t.id);
  } catch {
    /* no tabs permission for some tab / ignore */
  }
});

chrome.runtime.onMessage.addListener(
  (msg: ExtMessage, sender, sendResponse: (res: IngestResponse | AuthStatus | RecentResponse) => void) => {
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
