/**
 * Authenticated fetch wrapper with automatic token refresh.
 *
 * - Sends `credentials: 'include'` so the HttpOnly access + refresh cookies
 *   are automatically attached by the browser.
 * - On 401: silently attempts POST /api/auth/refresh (which rotates the
 *   refresh cookie and sets a new access cookie), then retries the original
 *   request exactly once.
 * - If refresh also fails: clears auth state and redirects to /login.
 *
 * NOTE: The access token is now stored in an HttpOnly cookie (`cv_access`),
 * NOT in localStorage. The `Authorization: Bearer` header is no longer sent
 * by the web frontend — only the browser extension uses that path.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      return false;
    }

    // The server sets new cv_access and cv_refresh cookies automatically.
    // We don't need to store anything in localStorage.
    return true;
  } catch {
    return false;
  }
}

/**
 * Refreshes the access token exactly once, deduplicating concurrent calls.
 * Returns true if refresh succeeded, false otherwise.
 */
async function refreshAccessToken(): Promise<boolean> {
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
  localStorage.removeItem("user");
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const url = path.startsWith("http") ? path : `${API_URL}${path}`;

  let res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  // If 401, try refreshing the access token cookie
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      // Retry the original request — the new cv_access cookie is already set
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
