"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function EmailCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setErrorMsg("No login token received.");
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/email/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Verification failed (${res.status})`);
        }

        const data = await res.json();

        // Store the JWT token and user info
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Redirect to dashboard
        router.push("/dashboard");
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.message || "Something went wrong during token verification.");
      }
    };

    verifyToken();
  }, [searchParams, router]);

  if (status === "error") {
    return (
      <div className="auth" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ marginBottom: 8 }}>Authentication Failed</h2>
          <p style={{ color: "var(--muted, #6f6d61)", marginBottom: 24 }}>{errorMsg}</p>
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
      <p style={{ color: "var(--muted, #6f6d61)" }}>Verifying your secure link...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function EmailCallback() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p>Loading...</p>
      </div>
    }>
      <EmailCallbackHandler />
    </Suspense>
  );
}
