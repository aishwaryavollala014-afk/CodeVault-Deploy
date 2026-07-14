import { getRecent, getStatus, signOut, WEB_APP_URL } from '../lib/auth';
import type { PlatformName, RecentItem } from '../types';

const statusEl = document.getElementById('status')!;
const statusText = document.getElementById('statusText')!;
const signedOut = document.getElementById('signedOut')!;
const signedIn = document.getElementById('signedIn')!;
const recentEl = document.getElementById('recent')!;

const PLATFORM_EMOJI: Record<PlatformName, string> = {
  leetcode: '🟠',
  codeforces: '🔵',
  codechef: '🟤',
  hackerrank: '🟢',
};

const HOST_TO_PLATFORM: Array<[RegExp, PlatformName]> = [
  [/leetcode\.com/, 'leetcode'],
  [/codeforces\.com/, 'codeforces'],
  [/codechef\.com/, 'codechef'],
  [/hackerrank\.com/, 'hackerrank'],
];

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// Highlight the chip for the platform of the currently active tab.
async function highlightActivePlatform(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab?.url ?? '';
    const match = HOST_TO_PLATFORM.find(([re]) => re.test(url));
    if (!match) return;
    document.querySelector(`.chip[data-plat="${match[1]}"]`)?.classList.add('active');
  } catch {
    /* no tabs permission — skip */
  }
}

function renderRecent(items: RecentItem[]): void {
  if (!items.length) {
    recentEl.innerHTML = '<div class="empty">No captures yet — solve a problem to see it here.</div>';
    return;
  }
  recentEl.innerHTML = items
    .slice(0, 5)
    .map(
      (it, i) => `
      <div class="rec" style="animation-delay:${i * 40}ms">
        <span class="pemoji">${PLATFORM_EMOJI[it.platform] ?? '⚪'}</span>
        <span class="rtitle">${escapeHtml(it.title || it.slug)}</span>
        <span class="rnum">${escapeHtml(it.number)} · ${timeAgo(it.solvedAt)}</span>
      </div>`,
    )
    .join('');
}

function escapeHtml(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

async function render(): Promise<void> {
  const { signedIn: yes } = await getStatus();
  statusEl.className = `status ${yes ? 'on' : 'off'}`;
  statusText.textContent = yes ? 'Signed in' : 'Not signed in';
  signedIn.hidden = !yes;
  signedOut.hidden = yes;

  if (yes) {
    void highlightActivePlatform();
    const res = await getRecent();
    renderRecent(res.ok ? res.items ?? [] : []);
  }
}

// Sign in: open the web-app login and remember the tab so the background auto-closes it once
// the JWT is captured (user drops straight back to their coding tab).
document.getElementById('signIn')?.addEventListener('click', async () => {
  const tab = await chrome.tabs.create({ url: `${WEB_APP_URL}/login` });
  if (tab.id != null) await chrome.storage.local.set({ cvLoginTabId: tab.id });
  window.close();
});

document.getElementById('signOut')?.addEventListener('click', async () => {
  await signOut();
  await render();
});

document.querySelectorAll<HTMLButtonElement>('.actions button[data-open]').forEach((btn) => {
  btn.addEventListener('click', () => {
    chrome.tabs.create({ url: `${WEB_APP_URL}${btn.dataset.open}` });
    window.close();
  });
});

void render();
