"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlatformChip } from "@/components/PlatformChip";
import { CodeVaultLoader } from "@/components/CodeVaultLoader";
import { PLATFORMS, PLATFORM_ORDER } from "@/constants/platforms";
import { apiFetch } from "@/utils/api";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; githubLogin: string; handle?: string; displayName: string | null; email?: string } | null>(null);
  const [activeSection, setActiveSection] = useState("account");
  const [activeTheme, setActiveTheme] = useState("Light");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  const PLATFORMS_LIST = PLATFORM_ORDER.map((id) => PLATFORMS[id]);
  // platform -> repo full name (owner/name), loaded from and saved to /api/github-repos
  const [repos, setRepos] = useState<Record<string, string>>({});
  const [repoStatus, setRepoStatus] = useState<Record<string, string>>({});
  
  // New Settings State
  const [settingsForm, setSettingsForm] = useState({
    displayName: "",
    handle: "",
    publicProfileEnabled: true,
    sync: {
      autoSync: true,
      frequency: "Every 6 hours",
      includeQuestion: true,
      maintainReadme: true,
      onlyAccepted: true
    },
    notifications: {
      syncFailures: true,
      weeklySummary: false,
      productUpdates: false
    },
    appearance: {
      theme: "System"
    }
  });
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [accountSuccess, setAccountSuccess] = useState(false);

  // Load existing per-platform repo mappings.
  useEffect(() => {
    apiFetch(`${API_URL}/github-repos`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Array<{ platform: string; repoFullName: string }>) => {
        const map: Record<string, string> = {};
        (rows || []).forEach((row) => { map[row.platform] = row.repoFullName; });
        setRepos(map);
      })
      .catch(() => {});
  }, [API_URL]);

  // Load Settings
  useEffect(() => {
    apiFetch(`${API_URL}/settings`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data || data.error) return;
        setSettingsForm({
          displayName: data.displayName || "",
          handle: data.handle || "",
          publicProfileEnabled: data.publicProfileEnabled ?? true,
          sync: {
            autoSync: data.settings?.sync?.autoSync ?? true,
            frequency: data.settings?.sync?.frequency ?? "Every 6 hours",
            includeQuestion: data.settings?.sync?.includeQuestion ?? true,
            maintainReadme: data.settings?.sync?.maintainReadme ?? true,
            onlyAccepted: data.settings?.sync?.onlyAccepted ?? true,
          },
          notifications: {
            syncFailures: data.settings?.notifications?.syncFailures ?? true,
            weeklySummary: data.settings?.notifications?.weeklySummary ?? false,
            productUpdates: data.settings?.notifications?.productUpdates ?? false,
          },
          appearance: {
            theme: data.settings?.appearance?.theme ?? "System"
          }
        });
        setActiveTheme(data.settings?.appearance?.theme ?? "System");
      })
      .catch(console.error);
  }, [API_URL]);

  // Save (upsert) one platform's repo link.
  const saveRepo = async (platform: string) => {
    const repoFullName = (repos[platform] || "").trim();
    if (!/^[\w.-]+\/[\w.-]+$/.test(repoFullName)) {
      setRepoStatus((s) => ({ ...s, [platform]: "error" }));
      return;
    }
    setRepoStatus((s) => ({ ...s, [platform]: "saving" }));
    try {
      const res = await apiFetch(`${API_URL}/github-repos`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, repoFullName }),
      });
      setRepoStatus((s) => ({ ...s, [platform]: res.ok ? "saved" : "error" }));
    } catch {
      setRepoStatus((s) => ({ ...s, [platform]: "error" }));
    }
  };

  const saveAccountDetails = async () => {
    setSavingAccount(true);
    setAccountError("");
    setAccountSuccess(false);
    try {
      const res = await apiFetch(`${API_URL}/settings`, {
        method: "PATCH",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: settingsForm.displayName,
          handle: settingsForm.handle,
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAccountError(data.error || "Failed to save");
      } else {
        setAccountSuccess(true);
        // Update user state and local storage with new display name
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
           const u = JSON.parse(storedUser);
           u.displayName = data.displayName;
           localStorage.setItem("user", JSON.stringify(u));
           setUser(u);
        }
        setTimeout(() => setAccountSuccess(false), 3000);
      }
    } catch (e: any) {
      setAccountError(e.message || "Failed to save");
    } finally {
      setSavingAccount(false);
    }
  };

  const updateSetting = async (category: "sync" | "notifications" | "appearance", key: string, value: any) => {
    // Optimistic update
    setSettingsForm((prev) => ({
      ...prev,
      [category]: {
         ...(prev[category as keyof typeof prev] as any),
         [key]: value
      }
    }));
    
    if (category === "appearance" && key === "theme") {
      setActiveTheme(value);
    }

    try {
      await apiFetch(`${API_URL}/settings`, {
        method: "PATCH",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            [category]: { [key]: value }
          }
        })
      });
    } catch(e) { console.error(e); }
  };

  const updatePublicProfile = async (enabled: boolean) => {
    setSettingsForm((prev) => ({ ...prev, publicProfileEnabled: enabled }));
    try {
      await apiFetch(`${API_URL}/settings`, {
        method: "PATCH",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicProfileEnabled: enabled })
      });
    } catch(e) { console.error(e); }
  };

  // Real connected platforms + solved counts (no more hardcoded rows).
  type Conn = { platform: string; username: string; tokenStatus?: string };
  const [connections, setConnections] = useState<Conn[] | null>(null);
  const [solved, setSolved] = useState<Record<string, number>>({});

  const loadConnections = React.useCallback(() => {
    apiFetch(`${API_URL}/platforms`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Conn[]) => setConnections(Array.isArray(rows) ? rows : []))
      .catch(() => setConnections([]));
    apiFetch(`${API_URL}/stats`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const p = d?.platforms || {};
        const m: Record<string, number> = {};
        Object.keys(p).forEach((k) => { if (typeof p[k]?.total === "number") m[k] = p[k].total; });
        setSolved(m);
      })
      .catch(() => {});
  }, [API_URL]);

  useEffect(() => { loadConnections(); }, [loadConnections]);

  const disconnectPlatform = async (platform: string) => {
    await apiFetch(`${API_URL}/platforms/${platform}`, {
      method: "DELETE",
      credentials: 'include',
    }).catch(() => {});
    loadConnections();
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.push("/login");
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch (e) {
      console.error("Failed to parse user data", e);
    }
  }, [router]);

  // Simple scroll listener to highlight active subnav section (matching prototype script)
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["account", "platforms", "github", "sync", "profile", "notif", "appearance", "danger"];
      let currentSection = "account";

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          // If the element is near the middle of the viewport
          if (rect.top <= 180 && rect.bottom >= 180) {
            currentSection = section;
            break;
          }
        }
      }
      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!user) {
    return <CodeVaultLoader text="Loading settings" />;
  }

  const initial = (user.displayName || user.handle || user.githubLogin || "user").charAt(0).toUpperCase();

  return (
    <>
      <nav className="subnav" aria-label="Settings sections">
        {[
          { id: "account", label: "Account" },
          { id: "platforms", label: "Platforms" },
          { id: "github", label: "GitHub" },
          { id: "sync", label: "Sync" },
          { id: "profile", label: "Public profile" },
          { id: "notif", label: "Notifications" },
          { id: "appearance", label: "Appearance" },
          { id: "danger", label: "Danger zone" },
        ].map((sec) => (
          <a
            key={sec.id}
            href={`#${sec.id}`}
            className={activeSection === sec.id ? "on" : ""}
            onClick={() => setActiveSection(sec.id)}
          >
            {sec.label}
          </a>
        ))}
      </nav>

      <div className="sections">
        {/* ACCOUNT */}
        <section className="panel" id="account">
          <h2>Account</h2>
          <p className="desc">Your basic profile details.</p>
          <div className="avrow">
            <div className="av">{initial}</div>
            <div>
              <button className="btn sm" type="button">Change avatar</button>
              <div style={{ fontSize: "12px", color: "var(--faint)", marginTop: "6px" }}>PNG or JPG, up to 2 MB</div>
            </div>
          </div>
          <div className="two">
            <div className="field">
              <label className="fl" htmlFor="name">Full name</label>
              <input 
                className="txt" 
                id="name" 
                type="text" 
                value={settingsForm.displayName} 
                onChange={(e) => setSettingsForm({ ...settingsForm, displayName: e.target.value })} 
              />
            </div>
            <div className="field">
              <label className="fl" htmlFor="handle">Profile handle</label>
              <input 
                className="txt" 
                id="handle" 
                type="text" 
                value={settingsForm.handle} 
                onChange={(e) => setSettingsForm({ ...settingsForm, handle: e.target.value })} 
              />
            </div>
          </div>
          {accountError && (
            <div style={{ color: "var(--brand-d)", fontSize: 13, marginBottom: 12 }}>
              {accountError}
            </div>
          )}
          <div className="field">
            <label className="fl" htmlFor="email">Email (from GitHub)</label>
            <input className="txt" id="email" type="email" defaultValue={user.email || `${user.githubLogin}@users.noreply.github.com`} readOnly />
          </div>
          <div className="row">
            <div className="rt">
              <div className="n">Plan</div>
              <div className="m">Free — up to 4 connected platforms</div>
            </div>
            <button className="btn brand right" type="button" onClick={() => alert("Plans are coming soon.")}>Upgrade</button>
          </div>
          <div className="save-bar">
            <button className="btn brand" type="button" onClick={saveAccountDetails} disabled={savingAccount}>
              {savingAccount ? "Saving..." : accountSuccess ? "Saved ✓" : "Save changes"}
            </button>
          </div>
        </section>

        {/* PLATFORMS */}
        <section className="panel" id="platforms">
          <h2>Connected platforms</h2>
          <p className="desc">Stats come from public profiles; code sync needs an authorized connection.</p>
          {connections === null ? (
            <p className="desc">Loading connections…</p>
          ) : connections.length === 0 ? (
            <p className="desc">No platforms connected yet. <Link href="/connect">Connect one</Link>.</p>
          ) : (
            connections.map((c) => {
              const meta = PLATFORMS_LIST.find((p) => p.id === c.platform);
              const expired = c.tokenStatus === "expired";
              const count = solved[c.platform];
              return (
                <div className="row" key={c.platform}>
                  <PlatformChip platformId={c.platform} size="sm" showName={false} variant="ghost" />
                  <div className="rt">
                    <div className="n">
                      {meta?.name || c.platform}{" "}
                      {expired
                        ? <span className="st-pill exp">Session expired</span>
                        : <span className="st-pill ok">Connected</span>}
                    </div>
                    <div className="m">@{c.username}{typeof count === "number" ? ` · ${count.toLocaleString()} solved` : ""}</div>
                  </div>
                  {expired ? (
                    <Link className="btn brand sm right" href="/connect">Reconnect</Link>
                  ) : (
                    <button className="btn danger sm right" type="button" onClick={() => disconnectPlatform(c.platform)}>Disconnect</button>
                  )}
                </div>
              );
            })
          )}
          <div className="save-bar">
            <Link className="btn" href="/connect">+ Add platform</Link>
          </div>
        </section>

        {/* GITHUB */}
        <section className="panel" id="github">
          <h2>GitHub</h2>
          <p className="desc">Where your accepted solutions are pushed.</p>
          <div className="row">
            <span className="badge-ic" style={{ background: "#16160f" }}>
              <svg className="ico sm" style={{ stroke: "#fff" }} aria-hidden="true"><use href="#ic-github"/></svg>
            </span>
            <div className="rt">
              <div className="n">{user.githubLogin} <span className="st-pill ok">Connected</span></div>
              <div className="m">via GitHub OAuth</div>
            </div>
            <button className="btn danger sm right" type="button">Disconnect</button>
          </div>
          <div className="field" style={{ marginTop: "14px" }}>
            <label className="fl">Target repository per platform</label>
            <p className="m" style={{ marginBottom: 12 }}>
              Paste the GitHub repo (<code>owner/name</code>) where each platform&apos;s accepted solutions get pushed. Each platform can have its own repo.
            </p>
            {PLATFORMS_LIST.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 140 }}>
                  <PlatformChip platformId={p.id} size="sm" showName={false} variant="ghost" />
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                </div>
                <input
                  className="txt"
                  aria-label={`${p.name} repository`}
                  placeholder={`${user.githubLogin}/${p.id}-solutions`}
                  value={repos[p.id] || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRepos((r) => ({ ...r, [p.id]: v }));
                    setRepoStatus((s) => ({ ...s, [p.id]: "" }));
                  }}
                  style={{ flex: 1, minWidth: 200 }}
                />
                <button className="btn brand sm" type="button" onClick={() => saveRepo(p.id)}>
                  {repoStatus[p.id] === "saving" ? "Saving…" : repoStatus[p.id] === "saved" ? "Saved ✓" : "Save"}
                </button>
                {repoStatus[p.id] === "error" && (
                  <span style={{ color: "var(--brand-d)", fontSize: 12, fontWeight: 600, flexBasis: "100%" }}>
                    Enter a valid <code>owner/name</code> repo.
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="two">
            <div className="field">
              <label className="fl" htmlFor="vis">Repository visibility</label>
              <select id="vis">
                <option>Public</option>
                <option>Private</option>
              </select>
            </div>
            <div className="field">
              <label className="fl" htmlFor="folder">Folder naming</label>
              <select id="folder">
                <option>By problem number — 0369/</option>
                <option>By difficulty — Medium/0369/</option>
                <option>By topic — DP/0369/</option>
              </select>
            </div>
          </div>
          <div className="row">
            <div className="rt">
              <div className="n">Commit author</div>
              <div className="m">{user.displayName || user.githubLogin} &lt;{user.email || `${user.githubLogin}@users.noreply.github.com`}&gt;</div>
            </div>
          </div>
        </section>

        {/* SYNC */}
        <section className="panel" id="sync">
          <h2>Sync preferences</h2>
          <p className="desc">Control when and what CodeVault pushes.</p>
          <div className="row">
            <div className="rt">
              <div className="n">Automatic sync</div>
              <div className="m">Run on a schedule in the background</div>
            </div>
            <label className="switch right">
              <input 
                type="checkbox" 
                checked={settingsForm.sync.autoSync} 
                onChange={(e) => updateSetting("sync", "autoSync", e.target.checked)} 
              />
              <span className="sl"></span>
            </label>
          </div>
          <div className="row">
            <div className="rt">
              <div className="n">Frequency</div>
              <div className="m">How often to check for new submissions</div>
            </div>
            <select 
              className="right" 
              style={{ width: "auto" }}
              value={settingsForm.sync.frequency}
              onChange={(e) => updateSetting("sync", "frequency", e.target.value)}
            >
              <option>Every 3 hours</option>
              <option>Every 6 hours</option>
              <option>Once a day</option>
            </select>
          </div>
          <div className="row">
            <div className="rt">
              <div className="n">Include question.md</div>
              <div className="m">Save the problem statement next to your solution</div>
            </div>
            <label className="switch right">
              <input 
                type="checkbox" 
                checked={settingsForm.sync.includeQuestion} 
                onChange={(e) => updateSetting("sync", "includeQuestion", e.target.checked)} 
              />
              <span className="sl"></span>
            </label>
          </div>
          <div className="row">
            <div className="rt">
              <div className="n">Maintain README index</div>
              <div className="m">Regenerate the repo's index table after each sync</div>
            </div>
            <label className="switch right">
              <input 
                type="checkbox" 
                checked={settingsForm.sync.maintainReadme} 
                onChange={(e) => updateSetting("sync", "maintainReadme", e.target.checked)} 
              />
              <span className="sl"></span>
            </label>
          </div>
          <div className="row">
            <div className="rt">
              <div className="n">Only accepted submissions</div>
              <div className="m">Skip partials and wrong answers</div>
            </div>
            <label className="switch right">
              <input 
                type="checkbox" 
                checked={settingsForm.sync.onlyAccepted} 
                onChange={(e) => updateSetting("sync", "onlyAccepted", e.target.checked)} 
              />
              <span className="sl"></span>
            </label>
          </div>
        </section>

        {/* PUBLIC PROFILE */}
        <section className="panel" id="profile">
          <h2>Public profile</h2>
          <p className="desc">A shareable page with your total analysis.</p>
          <div className="row">
            <div className="rt">
              <div className="n">Enable public profile</div>
              <div className="m mono">codevault.dev/u/{settingsForm.handle || user.githubLogin}</div>
            </div>
            <label className="switch right">
              <input 
                type="checkbox" 
                checked={settingsForm.publicProfileEnabled} 
                onChange={(e) => updatePublicProfile(e.target.checked)} 
              />
              <span className="sl"></span>
            </label>
          </div>
          <div className="save-bar">
            <Link className="btn" href={`/u/${settingsForm.handle || user.githubLogin}`}>View public profile →</Link>
          </div>
        </section>

        {/* NOTIFICATIONS */}
        <section className="panel" id="notif">
          <h2>Notifications</h2>
          <p className="desc">Emails sent to your GitHub address.</p>
          <div className="row">
            <div className="rt">
              <div className="n">Sync failures</div>
              <div className="m">Email me when a sync fails or a session expires</div>
            </div>
            <label className="switch right">
              <input 
                type="checkbox" 
                checked={settingsForm.notifications.syncFailures} 
                onChange={(e) => updateSetting("notifications", "syncFailures", e.target.checked)} 
              />
              <span className="sl"></span>
            </label>
          </div>
          <div className="row">
            <div className="rt">
              <div className="n">Weekly summary</div>
              <div className="m">A digest of what you solved each week</div>
            </div>
            <label className="switch right">
              <input 
                type="checkbox" 
                checked={settingsForm.notifications.weeklySummary} 
                onChange={(e) => updateSetting("notifications", "weeklySummary", e.target.checked)} 
              />
              <span className="sl"></span>
            </label>
          </div>
          <div className="row">
            <div className="rt">
              <div className="n">Product updates</div>
              <div className="m">Occasional news about new features</div>
            </div>
            <label className="switch right">
              <input 
                type="checkbox" 
                checked={settingsForm.notifications.productUpdates} 
                onChange={(e) => updateSetting("notifications", "productUpdates", e.target.checked)} 
              />
              <span className="sl"></span>
            </label>
          </div>
        </section>

        {/* APPEARANCE */}
        <section className="panel" id="appearance">
          <h2>Appearance</h2>
          <p className="desc">Choose how CodeVault looks.</p>
          <div className="seg" role="group" aria-label="Theme">
            {["Light", "Dark", "System"].map((t) => (
              <button
                key={t}
                type="button"
                className={activeTheme === t ? "on" : ""}
                onClick={() => updateSetting("appearance", "theme", t)}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* DANGER */}
        <section className="panel danger" id="danger">
          <h2 style={{ color: "var(--rose-d)" }}>Danger zone</h2>
          <p className="desc">These actions can't be undone.</p>
          <div className="row">
            <div className="rt">
              <div className="n">Disconnect all platforms</div>
              <div className="m">Stops all syncing. Your GitHub repos are kept.</div>
            </div>
            <button className="btn danger right" type="button">Disconnect all</button>
          </div>
          <div className="row">
            <div className="rt">
              <div className="n">Delete account</div>
              <div className="m">Permanently remove your CodeVault account and data.</div>
            </div>
            <button className="btn dangerfill right" type="button">Delete account</button>
          </div>
        </section>
      </div>
    </>
  );
}

