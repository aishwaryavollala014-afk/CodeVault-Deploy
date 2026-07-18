import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { getItem, setItem, deleteItem, TOKEN_KEY } from '../lib/storage';
import {
  setAccessToken,
  setUnauthorizedHandler,
} from '../api/token';
import {
  requestEmailLogin,
  verifyEmailLogin,
  fetchMe,
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const applyToken = useCallback(async (token: string | null) => {
    setAccessToken(token);
    if (token) await setItem(TOKEN_KEY, token);
    else await deleteItem(TOKEN_KEY);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      /* ignore */
    }
    await applyToken(null);
    setUser(null);
  }, [applyToken]);

  const refreshUser = useCallback(async () => {
    const data = await fetchMe();
    setUser(data.user ?? data);
  }, []);

  // Bootstrap: restore token, verify it still resolves to a user.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      applyToken(null);
      setUser(null);
    });
    (async () => {
      const saved = await getItem(TOKEN_KEY);
      if (saved) {
        setAccessToken(saved);
        try {
          await refreshUser();
        } catch {
          await applyToken(null);
        }
      }
      setLoading(false);
    })();
    return () => setUnauthorizedHandler(null);
  }, [applyToken, refreshUser]);

  const requestLogin = useCallback(async (email: string) => {
    await requestEmailLogin(email);
  }, []);

  const verify = useCallback(
    async (token: string) => {
      const data = await verifyEmailLogin(token);
      if (data.accessToken) await applyToken(data.accessToken);
      setUser(data.user ?? null);
      if (!data.user) await refreshUser();
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
