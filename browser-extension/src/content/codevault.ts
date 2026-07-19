import type { SetTokenMessage } from '../types';
import { WEB_API } from '../constants';

// Runs on the CodeVault web app origin. Auth is now an httpOnly cookie the extension can't
// read, so instead of reading localStorage we ask web-backend to trade the signed-in session
// for a token: with the session cookie attached (`credentials:'include'`), GET
// /auth/extension-token returns a long-lived JWT. We hand that to the background worker so the
// extension authenticates as the SAME user. Re-runs on load + focus, so each visit refreshes it.
async function syncToken(): Promise<void> {
  // After the extension is reloaded/updated, this old content script's context is gone and
  // `chrome.runtime.id` is undefined — bail out quietly (the page re-injects a fresh script).
  try {
    if (!chrome.runtime?.id) return;
    const res = await fetch(`${WEB_API}/auth/extension-token`, { credentials: 'include' });
    if (!res.ok) return; // 401 = not signed in on the web app yet — nothing to hand off
    const data = (await res.json()) as { token?: string };
    if (!data.token) return;
    const msg: SetTokenMessage = { type: 'setToken', token: data.token };
    chrome.runtime.sendMessage(msg).catch(() => undefined);
  } catch {
    /* network error or extension context invalidated — ignore; re-runs on next load/focus */
  }
}

// On load and whenever the tab regains focus (covers fresh logins + refreshing the token).
syncToken();
window.addEventListener('focus', syncToken);
