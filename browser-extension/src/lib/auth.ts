import type {
  AuthStatus,
  GetRecentMessage,
  GetStatusMessage,
  RecentResponse,
  SignOutMessage,
} from '../types';

// Popup-facing auth helpers. The background worker owns the token; these just message it.
export async function getStatus(): Promise<AuthStatus> {
  const res = (await chrome.runtime.sendMessage({ type: 'getStatus' } as GetStatusMessage)) as
    | AuthStatus
    | undefined;
  return res ?? { signedIn: false };
}

export async function signOut(): Promise<void> {
  await chrome.runtime.sendMessage({ type: 'signOut' } as SignOutMessage);
}

export async function getRecent(): Promise<RecentResponse> {
  const res = (await chrome.runtime.sendMessage({ type: 'getRecent' } as GetRecentMessage)) as
    | RecentResponse
    | undefined;
  return res ?? { ok: false };
}

// The CodeVault web app — opened so the user can sign in; the codevault content script
// then captures the JWT automatically.
export const WEB_APP_URL = 'http://localhost:3000';
