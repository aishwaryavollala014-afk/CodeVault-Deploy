/**
 * Authenticated fetch wrapper with automatic token refresh.
 *
 * - Attaches `Authorization: Bearer <access_token>` from localStorage.
 * - Sends `credentials: 'include'` so the HttpOnly refresh cookie is included.
 * - On 401: silently attempts POST /api/auth/refresh, stores the new access
 *   token, and retries the original request exactly once.
 * - If refresh also fails: clears auth state and redirects to /login.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function attemptRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.accessToken || null;
  } catch {
    return null;
  }
}

/**
 * Refreshes the access token exactly once, deduplicating concurrent calls.
 * Returns the new access token or null if refresh failed.
 */
async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = attemptRefresh().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });

  return refreshPromise;
}

function clearAuthAndRedirect(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem("token");

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const url = path.startsWith("http") ? path : `${API_URL}${path}`;

  let res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  // If 401 and we had a token, try refreshing
  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      localStorage.setItem("token", newToken);
      headers.set("Authorization", `Bearer ${newToken}`);

      res = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });

      // If still 401 after refresh, give up
      if (res.status === 401) {
        clearAuthAndRedirect();
      }
    } else {
      clearAuthAndRedirect();
    }
  }

  return res;
}
