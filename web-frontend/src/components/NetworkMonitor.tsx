"use client";

import { useEffect, useState } from "react";

// Live network health pill for the topbar. Patches window.fetch to measure, over a rolling
// 2s window: throughput (Mbps), request count, average latency and errors. A coloured dot
// summarises health — green (fast), yellow (slow), red (errors / very slow) — so the user can
// glance and understand how the app is talking to the backend.
export function NetworkMonitor() {
  const [s, setS] = useState({ mbps: 0, reqs: 0, latency: 0, errors: 0 });

  useEffect(() => {
    const orig = window.fetch;
    let bytes = 0,
      reqs = 0,
      latencySum = 0,
      latencyN = 0,
      errors = 0,
      total = 0,
      start = Date.now();

    window.fetch = async (...args) => {
      const t0 = performance.now();
      total++;
      reqs++;
      try {
        const res = await orig(...args);
        latencySum += performance.now() - t0;
        latencyN++;
        bytes += Number(res.headers.get("content-length")) || 0;
        if (!res.ok) errors++;
        return res;
      } catch (e) {
        errors++;
        throw e;
      }
    };

    const iv = setInterval(() => {
      const secs = (Date.now() - start) / 1000 || 1;
      setS({
        mbps: (bytes * 8) / secs / 1_000_000,
        reqs: total,
        latency: latencyN ? latencySum / latencyN : 0,
        errors,
      });
      bytes = reqs = latencySum = latencyN = errors = 0;
      start = Date.now();
    }, 2000);

    return () => {
      window.fetch = orig;
      clearInterval(iv);
    };
  }, []);

  const color =
    s.errors > 0 || s.latency > 1500 ? "#dc2626" : s.latency > 500 ? "#e8a200" : "#16a34a";
  const label = s.errors > 0 ? "errors" : s.latency > 1500 ? "slow" : s.latency > 500 ? "ok" : "good";

  return (
    <div
      title={`Network: ${s.mbps.toFixed(2)} Mbps · ${s.reqs} requests · ${Math.round(s.latency)}ms avg${s.errors ? ` · ${s.errors} errors` : ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "5px 10px",
        borderRadius: 999,
        border: "1px solid var(--line, #ecece4)",
        background: "var(--card, #fff)",
        fontSize: 11.5,
        fontWeight: 600,
        color: "var(--ink, #1a160f)",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 6px ${color}66`,
        }}
        aria-label={label}
      />
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{s.mbps.toFixed(1)} Mbps</span>
      <span style={{ color: "var(--muted, #6b7280)" }}>·</span>
      <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--muted, #6b7280)" }}>{s.reqs} req</span>
    </div>
  );
}
