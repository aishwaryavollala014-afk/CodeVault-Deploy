"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PLATFORMS } from "@/constants/platforms";
import { PlatformChip } from "@/components/PlatformChip";
import { CodeVaultLoader } from "@/components/CodeVaultLoader";

const GIT_URL = process.env.NEXT_PUBLIC_GIT_SERVICE_URL || "http://localhost:5050/api";

type ConnStatus = {
  connectionId: string;
  platform: "leetcode" | "codeforces" | "codechef" | "hackerrank";
  username: string;
  status: "active" | "expired";
  syncEnabled: boolean;
  lastSyncedAt: string | null;
  itemsSynced: number;
};

type ActivityItem = {
  id: string;
  type: "push" | "fetch" | "refresh" | "expire" | "error";
  message: string;
  platform: string;
  createdAt: string;
};

// Using centralized PLATFORMS

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function dotClass(type: ActivityItem["type"]): string {
  switch (type) {
    case "push":
      return "b";
    case "fetch":
      return "g";
    case "refresh":
      return "o";
    default:
      return "r"; // expire / error
  }
}

export default function SyncStatusPage() {
  const router = useRouter();
  const [conns, setConns] = useState<ConnStatus[] | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      setError("");
      const headers = { Authorization: `Bearer ${token}` };
      const [sRes, aRes] = await Promise.all([
        fetch(`${GIT_URL}/sync/status`, { headers }),
        fetch(`${GIT_URL}/sync/activity?limit=20`, { headers }),
      ]);
      if (!sRes.ok) throw new Error("Failed to load sync status");
      const sData = await sRes.json();
      setConns(sData.items ?? []);
      if (aRes.ok) {
        const aData = await aRes.json();
        setActivity(aData.items ?? []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not reach the sync service");
      setConns([]);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const runSync = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      setSyncing(true);
      setError("");
      await fetch(`${GIT_URL}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      await load();
    } catch {
      setError("Failed to trigger sync");
    } finally {
      setSyncing(false);
    }
  };

  if (conns === null) {
    return <CodeVaultLoader text="Loading sync status" />;
  }

  const activeCount = conns.filter((c) => c.status === "active" && c.syncEnabled).length;
  const total = conns.length;

  return (
    <>
      <section className="panel">
        <div className="health">
          <div className="hi">●</div>
          <div className="t">
            <div className="n">
              {activeCount} of {total} platform{total === 1 ? "" : "s"} syncing
            </div>
            <div className="m">
              {activity[0] ? `Last activity ${timeAgo(activity[0].createdAt)}` : "No sync activity yet"}
            </div>
          </div>
          <div className="acts">
            <button className="btn brand" type="button" onClick={runSync} disabled={syncing}>
              <svg className="ico sm" aria-hidden="true">
                <use href="#ic-sync" />
              </svg>{" "}
              {syncing ? "Syncing…" : "Run sync now"}
            </button>
          </div>
        </div>
        {error && (
          <p style={{ color: "var(--brand-d)", fontSize: 13, marginTop: 10, fontWeight: 600 }}>{error}</p>
        )}
      </section>

      <section className="panel">
        <h2 className="h">Connections</h2>
        {total === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            No platforms connected yet. <Link href="/connect">Connect one</Link>.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th scope="col">Platform</th>
                <th scope="col">Status</th>
                <th scope="col">Last synced</th>
                <th scope="col">Items</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {conns.map((c) => {
                const meta = PLATFORMS[c.platform] ?? { shortName: "?", iconClass: "", name: c.platform };
                return (
                  <tr key={c.connectionId}>
                    <td>
                      <span className="who2">
                        <PlatformChip platformId={c.platform} size="sm" showName={false} variant="ghost" /> {meta.name}{" "}
                        <span className="h">@{c.username}</span>
                      </span>
                    </td>
                    <td>
                      {c.status === "expired" ? (
                        <span className="st-pill exp">
                          <span className="d"></span> Session expired
                        </span>
                      ) : (
                        <span className="st-pill ok">
                          <span className="d"></span> Active
                        </span>
                      )}
                    </td>
                    <td className="tmono">{timeAgo(c.lastSyncedAt)}</td>
                    <td className="tmono">{c.itemsSynced}</td>
                    <td>
                      {c.status === "expired" ? (
                        <Link className="btn brand sm" href="/connect">
                          Reconnect
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <p style={{ fontSize: "12.5px", color: "var(--faint)", marginTop: "12px" }}>
          Stats keep working from public data even when a session expires — only code sync pauses until you reconnect.
        </p>
      </section>

      <section className="panel">
        <h2 className="h">
          Activity log{" "}
          <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--faint)" }}>
            most recent first
          </span>
        </h2>
        <div className="log">
          {activity.length === 0 ? (
            <div className="log-row">
              <span className="tx" style={{ color: "var(--muted)" }}>
                No sync activity yet.
              </span>
            </div>
          ) : (
            activity.map((a) => (
              <div className="log-row" key={a.id}>
                <span className="ts">{timeAgo(a.createdAt)}</span>
                <span className={`dot ${dotClass(a.type)}`}></span>
                <span className="tx">{a.message}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
