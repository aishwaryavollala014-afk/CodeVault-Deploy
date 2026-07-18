import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Small async key/value wrapper. Uses expo-secure-store on device;
 * falls back to localStorage on web so `expo start --web` doesn't crash.
 */
const web = Platform.OS === 'web';

export async function getItem(key: string): Promise<string | null> {
  if (web) return globalThis.localStorage?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (web) {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  if (web) {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const TOKEN_KEY = 'cv_access_token';
