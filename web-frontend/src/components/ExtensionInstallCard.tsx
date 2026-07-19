"use client";

import { useState } from "react";

// Dashboard card that lets a signed-in user install the CodeVault browser extension.
// NOTE: Chrome does not allow a web page to force-install an extension (inline install was
// removed in 2018), so the honest flow is: download the built extension, then "load unpacked".
// A true one-click "Add to Chrome" only exists once the extension is on the Chrome Web Store —
// swap the download button for the store URL then.
export function ExtensionInstallCard() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <section
      style={{
        border: "1px solid var(--border, #e6e1d3)",
        background: "var(--card, #fff)",
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        display: "flex",
        flexWrap: "wrap",
        gap: 20,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ flex: "1 1 320px", minWidth: 260 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>🧩</span>
          <strong style={{ fontSize: 16 }}>Install the CodeVault extension</strong>
        </div>
        <p style={{ fontSize: 14, color: "var(--muted, #6f6d61)", margin: "0 0 10px" }}>
          Auto-capture your accepted solutions and push them to GitHub — no copy-paste. Works in
          the background after you sign in once.
        </p>
        <ol style={{ fontSize: 13, color: "var(--muted, #6f6d61)", margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Click <strong>Download</strong> and unzip it.</li>
          <li>Open <code>chrome://extensions</code> and turn on <strong>Developer mode</strong> (top-right).</li>
          <li>Click <strong>Load unpacked</strong> and pick the unzipped folder.</li>
        </ol>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch" }}>
        <a
          href="/codevault-extension.zip"
          download
          className="btn btn-primary"
          style={{
            background: "var(--brand, #f1543f)",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 14,
            textAlign: "center",
            textDecoration: "none",
          }}
        >
          ⬇ Download extension
        </a>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{ background: "none", border: "none", color: "var(--faint, #9c9a8e)", fontSize: 12, cursor: "pointer" }}
        >
          Already installed
        </button>
      </div>
    </section>
  );
}
