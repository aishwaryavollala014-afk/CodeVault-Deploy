"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; githubLogin: string; displayName: string | null; email?: string } | null>(null);
  const [activeSection, setActiveSection] = useState("account");
  const [activeTheme, setActiveTheme] = useState("Light");

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
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading settings...</div>;
  }

  const initial = (user.displayName || user.githubLogin).charAt(0).toUpperCase();

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
              <input className="txt" id="name" type="text" defaultValue={user.displayName || user.githubLogin} />
            </div>
            <div className="field">
              <label className="fl" htmlFor="handle">Profile handle</label>
              <input className="txt" id="handle" type="text" defaultValue={user.githubLogin} />
            </div>
          </div>
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
            <button className="btn" type="button">Cancel</button>
            <button className="btn brand" type="button">Save changes</button>
          </div>
        </section>

        {/* PLATFORMS */}
        <section className="panel" id="platforms">
          <h2>Connected platforms</h2>
          <p className="desc">Stats come from public profiles; code sync needs an authorized connection.</p>
          <div className="row">
            <span className="badge-ic lc">LC</span>
            <div className="rt">
              <div className="n">LeetCode <span className="st-pill ok">Connected</span></div>
              <div className="m">@{user.githubLogin} · 612 solved</div>
            </div>
            <button className="btn danger sm right" type="button">Disconnect</button>
          </div>
          <div className="row">
            <span className="badge-ic cf">CF</span>
            <div className="rt">
              <div className="n">Codeforces <span className="st-pill ok">Connected</span></div>
              <div className="m">@{user.githubLogin}_t · 341 solved</div>
            </div>
            <button className="btn danger sm right" type="button">Disconnect</button>
          </div>
          <div className="row">
            <span className="badge-ic cc">CC</span>
            <div className="rt">
              <div className="n">CodeChef <span className="st-pill ok">Connected</span></div>
              <div className="m">@{user.githubLogin}06 · 184 solved</div>
            </div>
            <button className="btn danger sm right" type="button">Disconnect</button>
          </div>
          <div className="row">
            <span className="badge-ic hr">HR</span>
            <div className="rt">
              <div className="n">HackerRank <span className="st-pill exp">Session expired</span></div>
              <div className="m">@{user.githubLogin}g · 111 solved</div>
            </div>
            <Link className="btn brand sm right" href="/connect">Reconnect</Link>
          </div>
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
            <label className="fl" htmlFor="repo">Target repository</label>
            <select id="repo">
              <option>{user.githubLogin}/LeetCodeQuestions</option>
              <option>{user.githubLogin}/CodeforcesSolutions</option>
              <option>+ Create new repository…</option>
            </select>
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
              <input type="checkbox" defaultChecked />
              <span className="sl"></span>
            </label>
          </div>
          <div className="row">
            <div className="rt">
              <div className="n">Frequency</div>
              <div className="m">How often to check for new submissions</div>
            </div>
            <select className="right" style={{ width: "auto" }}>
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
              <input type="checkbox" defaultChecked />
              <span className="sl"></span>
            </label>
          </div>
          <div className="row">
            <div className="rt">
              <div className="n">Maintain README index</div>
              <div className="m">Regenerate the repo's index table after each sync</div>
            </div>
            <label className="switch right">
              <input type="checkbox" defaultChecked />
              <span className="sl"></span>
            </label>
          </div>
          <div className="row">
            <div className="rt">
              <div className="n">Only accepted submissions</div>
              <div className="m">Skip partials and wrong answers</div>
            </div>
            <label className="switch right">
              <input type="checkbox" defaultChecked />
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
              <div className="m mono">codevault.dev/u/{user.githubLogin}</div>
            </div>
            <label className="switch right">
              <input type="checkbox" defaultChecked />
              <span className="sl"></span>
            </label>
          </div>
          <div className="save-bar">
            <Link className="btn" href="/public-profile">Manage public profile →</Link>
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
              <input type="checkbox" defaultChecked />
              <span className="sl"></span>
            </label>
          </div>
          <div className="row">
            <div className="rt">
              <div className="n">Weekly summary</div>
              <div className="m">A digest of what you solved each week</div>
            </div>
            <label className="switch right">
              <input type="checkbox" />
              <span className="sl"></span>
            </label>
          </div>
          <div className="row">
            <div className="rt">
              <div className="n">Product updates</div>
              <div className="m">Occasional news about new features</div>
            </div>
            <label className="switch right">
              <input type="checkbox" />
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
                onClick={() => setActiveTheme(t)}
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
