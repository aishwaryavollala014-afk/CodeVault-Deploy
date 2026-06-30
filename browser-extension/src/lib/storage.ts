import type { PlatformName } from '../types';

// Wrappers around chrome.storage.local. The JWT is written here by the (future) sign-in
// flow; content scripts never touch it directly — only the background worker reads it.
const TOKEN_KEY = 'cv_token';
const ENABLED_KEY = 'cv_enabled'; // per-platform auto-capture toggles

export async function getToken(): Promise<string | null> {
  const out = await chrome.storage.local.get(TOKEN_KEY);
  return (out[TOKEN_KEY] as string) ?? null;
}

export async function setToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [TOKEN_KEY]: token });
}

export async function clearToken(): Promise<void> {
  await chrome.storage.local.remove(TOKEN_KEY);
}

export async function isPlatformEnabled(platform: PlatformName): Promise<boolean> {
  const out = await chrome.storage.local.get(ENABLED_KEY);
  const map = (out[ENABLED_KEY] as Record<string, boolean>) ?? {};
  // default on unless explicitly disabled
  return map[platform] !== false;
}

export async function setPlatformEnabled(platform: PlatformName, enabled: boolean): Promise<void> {
  const out = await chrome.storage.local.get(ENABLED_KEY);
  const map = (out[ENABLED_KEY] as Record<string, boolean>) ?? {};
  map[platform] = enabled;
  await chrome.storage.local.set({ [ENABLED_KEY]: map });
}
