import axios, { AxiosInstance } from 'axios';
import { WEB_API, GIT_API } from '../lib/config';
import { getAccessToken, setAccessToken, fireUnauthorized } from './token';

function make(baseURL: string): AxiosInstance {
  const c = axios.create({ baseURL, timeout: 20000, withCredentials: true });

  c.interceptors.request.use((cfg) => {
    const t = getAccessToken();
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
    return cfg;
  });

  c.interceptors.response.use(
    (r) => r,
    async (error) => {
      const original = error.config;
      const status = error.response?.status;
      // One transparent refresh attempt on 401 (refresh cookie lives in the
      // native cookie jar; the endpoint returns a fresh accessToken in the body).
      if (status === 401 && original && !original._retried) {
        original._retried = true;
        try {
          const res = await axios.post(
            `${WEB_API}/auth/refresh`,
            {},
            { withCredentials: true },
          );
          const next = res.data?.accessToken;
          if (next) {
            setAccessToken(next);
            original.headers.Authorization = `Bearer ${next}`;
            return c(original);
          }
        } catch {
          // fall through to sign-out
        }
        fireUnauthorized();
      }
      return Promise.reject(error);
    },
  );

  return c;
}

export const web = make(WEB_API);
export const git = make(GIT_API);

/** Normalize an axios error into a short, displayable message. */
export function errMsg(e: any): string {
  return (
    e?.response?.data?.error?.message ||
    e?.response?.data?.error ||
    e?.response?.data?.message ||
    e?.message ||
    'Something went wrong'
  );
}
