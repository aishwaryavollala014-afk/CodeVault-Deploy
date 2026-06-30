"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SyncStatusPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; githubLogin: string; displayName: string | null } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch (e) {
      console.error("Failed to parse user data", e);
    }
  }, [router]);

  if (!user) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading sync status...</div>;
  }

  return (
    <>
      <section className="panel">
        <div className="health">
          <div className="hi">●</div>
          <div className="t">
            <div className="n">3 of 4 platforms syncing</div>
            <div className="m">Last run 2 hours ago · 37 new solutions pushed this week</div>
          </div>
          <div className="acts">
            <span className="next">next run in 1h 12m</span>
            <button className="btn brand" type="button">
              <svg className="ico sm" aria-hidden="true"><use href="#ic-sync"/></svg> Run sync now
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="h">Connections</h2>
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
            <tr>
              <td><span className="who2"><span className="badge-ic lc">LC</span> LeetCode <span className="h">@{user.githubLogin}</span></span></td>
              <td><span className="st-pill ok"><span className="d"></span> Active</span></td>
              <td className="tmono">2h ago</td>
              <td className="tmono">612</td>
              <td></td>
            </tr>
            <tr>
              <td><span className="who2"><span className="badge-ic cf">CF</span> Codeforces <span className="h">@{user.githubLogin}_t</span></span></td>
              <td><span className="st-pill ok"><span className="d"></span> Active</span></td>
              <td className="tmono">2h ago</td>
              <td className="tmono">341</td>
              <td></td>
            </tr>
            <tr>
              <td><span className="who2"><span className="badge-ic cc">CC</span> CodeChef <span className="h">@{user.githubLogin}06</span></span></td>
              <td><span className="st-pill ok"><span className="d"></span> Active</span></td>
              <td className="tmono">2h ago</td>
              <td className="tmono">184</td>
              <td></td>
            </tr>
            <tr>
              <td><span className="who2"><span className="badge-ic hr">HR</span> HackerRank <span className="h">@{user.githubLogin}g</span></span></td>
              <td><span className="st-pill exp"><span className="d"></span> Session expired</span></td>
              <td className="tmono">6d ago</td>
              <td className="tmono">111</td>
              <td>
                <Link className="btn brand sm" href="/connect">Reconnect</Link>
              </td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: "12.5px", color: "var(--faint)", marginTop: "12px" }}>
          Stats keep working from public data even when a session expires — only code sync pauses until you reconnect.
        </p>
      </section>

      <section className="panel">
        <h2 className="h">Activity log <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--faint)" }}>most recent first</span></h2>
        <div className="log">
          <div className="log-row">
            <span className="ts">14:32 today</span>
            <span className="dot b"></span>
            <span className="tx">Pushed <span className="mono">0369/solution.py</span> to LeetCodeQuestions</span>
          </div>
          <div className="log-row">
            <span className="ts">14:32 today</span>
            <span className="dot g"></span>
            <span className="tx">Fetched 3 new accepted submissions from LeetCode</span>
          </div>
          <div className="log-row">
            <span className="ts">14:31 today</span>
            <span className="dot g"></span>
            <span className="tx">Regenerated README index (612 problems)</span>
          </div>
          <div className="log-row">
            <span className="ts">14:30 today</span>
            <span className="dot o"></span>
            <span className="tx">Codeforces session refreshed automatically</span>
          </div>
          <div className="log-row">
            <span className="ts">6 days ago</span>
            <span className="dot r"></span>
            <span className="tx">HackerRank session expired — code sync paused</span>
          </div>
          <div className="log-row">
            <span className="ts">1 week ago</span>
            <span className="dot b"></span>
            <span className="tx">Pushed <span className="mono">0704/solution.java</span> to LeetCodeQuestions</span>
          </div>
        </div>
      </section>
    </>
  );
}
