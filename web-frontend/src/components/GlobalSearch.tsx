"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// Searchable destinations inside CodeVault (pages, settings sections, platforms).
const TARGETS: { label: string; href: string; keys: string[] }[] = [
  { label: "Overview / Dashboard", href: "/dashboard", keys: ["overview", "dashboard", "home", "stats", "problems"] },
  { label: "Repositories", href: "/repositories", keys: ["repo", "repositories", "github", "sync repo"] },
  { label: "Analytics", href: "/analytics", keys: ["analytics", "charts", "rating", "language", "difficulty"] },
  { label: "Public profile", href: "/public-profile", keys: ["public", "profile", "share"] },
  { label: "Messages", href: "/messages", keys: ["messages", "chat", "dm", "inbox"] },
  { label: "Sync status", href: "/sync-status", keys: ["sync", "status", "activity", "push"] },
  { label: "Settings", href: "/settings", keys: ["settings", "account", "github", "platforms", "notifications", "appearance", "theme"] },
  { label: "Connect a platform", href: "/connect", keys: ["connect", "add", "platform", "leetcode", "codeforces", "codechef", "hackerrank"] },
];

const RECENT_KEY = "cv-recent-searches";
const MAX_RECENT = 5;

type FoundUser = {
  id: string;
  handle: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  followerCount?: number;
  problemsSolved?: number;
  platforms?: string[];
};

type RecentItem = { handle: string; displayName?: string | null; avatarUrl?: string | null };

/** Platform badge CSS class map */
const PLAT_CLASS: Record<string, string> = {
  leetcode: "lc",
  codeforces: "cf",
  codechef: "cc",
  hackerrank: "hr",
};

// ── Helpers ────────────────────────────────────────────────────────────

function getRecent(): RecentItem[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").slice(0, MAX_RECENT);
  } catch { return []; }
}

function addRecent(item: RecentItem) {
  const list = getRecent().filter((r) => r.handle !== item.handle);
  list.unshift(item);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
}

function clearRecent() {
  localStorage.removeItem(RECENT_KEY);
}

/** Bold the matched substring (social-search affordance). */
function Hl({ text, q }: { text: string; q: string }) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0 || !q) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <b style={{ color: "var(--ink)" }}>{text.slice(i, i + q.length)}</b>
      {text.slice(i + q.length)}
    </>
  );
}

function Skeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div className="cmd-skel" key={i}>
          <div className="cmd-skel-av" />
          <div className="cmd-skel-lines">
            <div className="cmd-skel-line short" />
            <div className="cmd-skel-line xs" />
          </div>
        </div>
      ))}
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [people, setPeople] = useState<FoundUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [hi, setHi] = useState(0);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMac = typeof navigator !== "undefined" && /mac/i.test(navigator.platform);

  const query = q.trim();

  // Filter page targets by query
  const pages = query
    ? TARGETS.filter((t) =>
        t.label.toLowerCase().includes(query.toLowerCase()) ||
        t.keys.some((k) => k.includes(query.toLowerCase()))
      )
    : [];

  // ── Open / close ──────────────────────────────────────────────────

  const openModal = useCallback(() => {
    setOpen(true);
    setRecent(getRecent());
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    setQ("");
    setPeople([]);
    setSearching(false);
  }, []);

  // Ctrl/Cmd+K global shortcut + "/" shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;

      // Ctrl+K / Cmd+K
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (open) closeModal();
        else openModal();
        return;
      }

      // "/" to open (when not in an input)
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && !open) {
        e.preventDefault();
        openModal();
      }

      // Escape to close
      if (e.key === "Escape" && open) {
        e.preventDefault();
        closeModal();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, openModal, closeModal]);

  // ── API search (debounced 200ms) ──────────────────────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    if (query.length < 2) { setPeople([]); setSearching(false); return; }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d) setPeople(d.users || []); })
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 200);
  }, [query]);

  // ── Flatten results ───────────────────────────────────────────────

  type Row = { kind: "person" | "page" | "recent"; label: string; href: string; user?: FoundUser; recent?: RecentItem };

  const rows: Row[] = query
    ? [
        ...people.map((u) => ({
          kind: "person" as const,
          label: u.displayName || u.handle,
          href: `/u/${u.handle}`,
          user: u,
        })),
        ...pages.map((p) => ({
          kind: "page" as const,
          label: p.label,
          href: p.href,
        })),
      ]
    : recent.map((r) => ({
        kind: "recent" as const,
        label: r.displayName || r.handle,
        href: `/u/${r.handle}`,
        recent: r,
      }));

  // Reset highlight when results change
  useEffect(() => { setHi(0); }, [q, people.length, recent.length]);

  // ── Navigate ──────────────────────────────────────────────────────

  const go = (href: string, user?: FoundUser | RecentItem) => {
    if (user && "handle" in user) {
      addRecent({ handle: user.handle, displayName: user.displayName, avatarUrl: user.avatarUrl });
    }
    closeModal();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, rows.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter" && rows[hi]) {
      e.preventDefault();
      go(rows[hi].href, rows[hi].user || rows[hi].recent);
    }
  };

  // ── Render ────────────────────────────────────────────────────────

  return (
    <>
      {/* Topbar trigger button */}
      <button
        className="search-trigger"
        onClick={openModal}
        type="button"
        aria-label="Open search"
      >
        <svg className="ico sm"><use href="#ic-search" /></svg>
        <span className="label-text">Search…</span>
        <span className="kbd">{isMac ? "⌘K" : "Ctrl+K"}</span>
      </button>

      {/* Command-palette modal — portaled to body to escape topbar's backdrop-filter containing block */}
      {open && createPortal(
        <div className="cmd-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="cmd-modal" role="dialog" aria-label="Search">
            {/* Search input */}
            <div className="cmd-field">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.7" y2="16.7" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search people, pages…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button className="cmd-clear" onClick={() => { setQ(""); inputRef.current?.focus(); }} type="button">
                  Clear
                </button>
              )}
            </div>

            {/* Results body */}
            <div className="cmd-body">
              {/* Searching state — skeletons */}
              {searching && people.length === 0 && <Skeleton />}

              {/* No query — show recent searches */}
              {!query && recent.length > 0 && (
                <>
                  <div className="cmd-recent-header">
                    <span>Recent</span>
                    <button className="cmd-recent-clear" onClick={() => { clearRecent(); setRecent([]); }} type="button">Clear</button>
                  </div>
                  {recent.map((r, i) => (
                    <div
                      key={r.handle}
                      className={`cmd-row${hi === i ? " active" : ""}`}
                      onMouseDown={() => go(`/u/${r.handle}`, r)}
                      onMouseEnter={() => setHi(i)}
                    >
                      {r.avatarUrl ? (
                        <img className="cmd-av" src={r.avatarUrl} alt="" />
                      ) : (
                        <span className="cmd-av-fallback">{r.handle.charAt(0).toUpperCase()}</span>
                      )}
                      <div className="cmd-info">
                        <div className="cmd-name">{r.displayName || r.handle}</div>
                        <div className="cmd-handle">@{r.handle}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* No query, no recent */}
              {!query && recent.length === 0 && (
                <div className="cmd-empty">
                  Search for people by handle or name
                  <div className="tip">Or jump to pages like Dashboard, Analytics, Settings…</div>
                </div>
              )}

              {/* People results */}
              {query && people.length > 0 && (
                <>
                  <div className="cmd-section">People</div>
                  {people.map((u, i) => (
                    <div
                      key={u.id}
                      className={`cmd-row${hi === i ? " active" : ""}`}
                      onMouseDown={() => go(`/u/${u.handle}`, u)}
                      onMouseEnter={() => setHi(i)}
                    >
                      {u.avatarUrl ? (
                        <img className="cmd-av" src={u.avatarUrl} alt="" />
                      ) : (
                        <span className="cmd-av-fallback">{u.handle.charAt(0).toUpperCase()}</span>
                      )}
                      <div className="cmd-info">
                        <div className="cmd-name"><Hl text={u.displayName || u.handle} q={query} /></div>
                        <div className="cmd-handle">@<Hl text={u.handle} q={query} /></div>
                        <div className="cmd-meta">
                          {typeof u.problemsSolved === "number" && (
                            <span className="cmd-meta-item">🔥 <b>{u.problemsSolved}</b> solved</span>
                          )}
                          {typeof u.followerCount === "number" && (
                            <span className="cmd-meta-item">👥 <b>{u.followerCount}</b> followers</span>
                          )}
                        </div>
                      </div>
                      {u.platforms && u.platforms.length > 0 && (
                        <div className="cmd-platforms">
                          {u.platforms.map((p) => (
                            <div
                              key={p}
                              className={`cmd-plat-badge ${PLAT_CLASS[p] || ""}`}
                              title={p.charAt(0).toUpperCase() + p.slice(1)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* Page results */}
              {query && pages.length > 0 && (
                <>
                  <div className="cmd-section">Pages</div>
                  {pages.map((p, idx) => {
                    const rowIdx = people.length + idx;
                    return (
                      <div
                        key={p.href}
                        className={`cmd-row${hi === rowIdx ? " active" : ""}`}
                        onMouseDown={() => go(p.href)}
                        onMouseEnter={() => setHi(rowIdx)}
                      >
                        <div className="cmd-page-icon">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.7" y2="16.7" />
                          </svg>
                        </div>
                        <span style={{ fontSize: 14, color: "var(--ink-2)" }}>{p.label}</span>
                      </div>
                    );
                  })}
                </>
              )}

              {/* No results */}
              {query.length >= 2 && !searching && people.length === 0 && pages.length === 0 && (
                <div className="cmd-empty">
                  No results for &ldquo;{query}&rdquo;
                  <div className="tip">Try a different handle or name</div>
                </div>
              )}
            </div>

            {/* Footer with keyboard hints */}
            <div className="cmd-footer">
              <span><span className="kbd">↑↓</span> navigate</span>
              <span><span className="kbd">↵</span> open</span>
              <span><span className="kbd">esc</span> close</span>
            </div>
          </div>
        </div>
      , document.body)}
    </>
  );
}
