"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setStatus("error");
      setErrorMsg("No authorization code received from GitHub.");
      return;
    }

    // CSRF check: the state GitHub echoes back must match the one we generated pre-redirect.
    const returnedState = searchParams.get("state");
    const savedState = sessionStorage.getItem("gh_oauth_state");
    sessionStorage.removeItem("gh_oauth_state");
    if (!returnedState || !savedState || returnedState !== savedState) {
      setStatus("error");
      setErrorMsg("Invalid or missing sign-in state (possible CSRF). Please start sign-in again.");
      return;
    }

    const exchangeCode = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/github`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ code }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || `Authentication failed (${res.status})`);
        }

        const data = await res.json();

        // The access token is now in an HttpOnly cookie (cv_access) set by the server.
        // We only store the user object for UI rendering (non-sensitive).
        localStorage.setItem("user", JSON.stringify(data.user));

        // Redirect to dashboard (or home for now)
        router.push("/dashboard");
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.message || "Something went wrong during authentication.");
      }
    };

    exchangeCode();
  }, [searchParams, router]);

  if (status === "error") {
    return (
      <div className="auth" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ marginBottom: 8 }}>Authentication Failed</h2>
          <p style={{ color: "var(--muted)", marginBottom: 24 }}>{errorMsg}</p>
          <a className="btn btn-primary" href="/login">Try again</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: 16 }}>
      <div style={{
        width: 40, height: 40, border: "3px solid var(--border, #e0dcd0)",
        borderTopColor: "var(--brand, #f1543f)", borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <p style={{ color: "var(--muted, #6f6d61)" }}>Signing you in...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function LoginCallback() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p>Loading...</p>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
