import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { getItem, setItem, deleteItem, TOKEN_KEY, USER_KEY } from '../lib/storage';
import { setAccessToken, setUnauthorizedHandler } from '../api/token';
import {
  requestEmailLogin,
  verifyEmailLogin,
  fetchSettings,
  logout as apiLogout,
} from '../api/endpoints';

type User = {
  id: string;
  handle: string;
  githubLogin: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  email?: string;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  requestLogin: (email: string) => Promise<void>;
  verify: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

/** Accept either a raw token or a full magic-link URL and extract the token. */
export function extractToken(input: string): string {
  const s = input.trim();
  const m = s.match(/[?&]token=([^&\s]+)/);
  return m ? decodeURIComponent(m[1]) : s;
}

async function persistUser(u: User | null) {
  if (u) await setItem(USER_KEY, JSON.stringify(u));
  else await deleteItem(USER_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const applyToken = useCallback(async (token: string | null) => {
    setAccessToken(token);
    if (token) await setItem(TOKEN_KEY, token);
    else await deleteItem(TOKEN_KEY);
  }, []);

  const clearSession = useCallback(async () => {
    await applyToken(null);
    await persistUser(null);
    setUser(null);
  }, [applyToken]);

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      /* ignore */
    }
    await clearSession();
  }, [clearSession]);

  /**
   * Hydrate the full profile. The JWT / `/auth/me` only carry `userId`, so the
   * name/handle/email come from `/settings` (keyed by that userId). Also doubles
   * as a token-validity check — a 401 here rejects and triggers sign-out.
   */
  const refreshUser = useCallback(async () => {
    const s: any = await fetchSettings();
    setUser((prev) => {
      const merged: User = {
        id: s.id ?? prev?.id ?? '',
        handle: s.handle ?? prev?.handle ?? '',
        displayName: s.displayName ?? prev?.displayName ?? null,
        githubLogin: s.githubLogin ?? prev?.githubLogin ?? null,
        avatarUrl: s.avatarUrl ?? prev?.avatarUrl ?? null,
        email: s.email ?? prev?.email,
      };
      persistUser(merged);
      return merged;
    });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });
    (async () => {
      const savedToken = await getItem(TOKEN_KEY);
      if (savedToken) {
        setAccessToken(savedToken);
        const savedUser = await getItem(USER_KEY);
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser)); // instant display
          } catch {
            /* ignore */
          }
        }
        try {
          await refreshUser(); // validate token + hydrate/refresh profile
        } catch {
          await clearSession();
        }
      }
      setLoading(false);
    })();
    return () => setUnauthorizedHandler(null);
  }, [clearSession, refreshUser]);

  const requestLogin = useCallback(async (email: string) => {
    await requestEmailLogin(email);
  }, []);

  const verify = useCallback(
    async (token: string) => {
      const data: any = await verifyEmailLogin(token);
      if (data.accessToken) await applyToken(data.accessToken);
      if (data.user) {
        setUser(data.user);
        await persistUser(data.user);
      }
      // Enrich/repair from /settings (also covers logins that omit some fields).
      try {
        await refreshUser();
      } catch {
        /* keep login user */
      }
    },
    [applyToken, refreshUser],
  );

  const value = useMemo(
    () => ({ user, loading, requestLogin, verify, signOut, refreshUser }),
    [user, loading, requestLogin, verify, signOut, refreshUser],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}
