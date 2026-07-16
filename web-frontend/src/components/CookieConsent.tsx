"use client";

import { useEffect, useState } from "react";

// GDPR-style cookie consent banner. CodeVault uses cookies to keep users signed in (httpOnly
// session cookie), so we surface this once and remember the choice in localStorage.
export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("cv_cookie_consent")) setShow(true);
    } catch {
      /* storage blocked — don't nag */
    }
  }, []);

  const choose = (v: "accepted" | "declined") => {
    try {
      localStorage.setItem("cv_cookie_consent", v);
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 1000,
        maxWidth: 720,
        margin: "0 auto",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        borderRadius: 14,
        background: "#ffffff",
        border: "1px solid #ecece4",
        boxShadow: "0 8px 30px rgba(26,22,15,.14)",
        font: "500 13px/1.5 system-ui, -apple-system, sans-serif",
        color: "#1a160f",
      }}
    >
      <div style={{ flex: "1 1 320px", minWidth: 240 }}>
        🍪 We use cookies to keep you signed in and to improve CodeVault. See our{" "}
        <a href="/privacy" style={{ color: "#f1543f", fontWeight: 600 }}>
          Privacy Policy
        </a>
        .
      </div>
      <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
        <button
          onClick={() => choose("declined")}
          style={{
            padding: "9px 16px",
            borderRadius: 10,
            border: "1px solid #ecece4",
            background: "#fff",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            color: "#6b7280",
          }}
        >
          Decline
        </button>
        <button
          onClick={() => choose("accepted")}
          style={{
            padding: "9px 18px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #f1543f, #ff6a50)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(241,84,63,.28)",
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
