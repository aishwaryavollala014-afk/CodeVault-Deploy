"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/utils/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const POLL_MS = 4000;

type ChatUser = { id: string; handle: string; displayName?: string | null; avatarUrl?: string | null };
type Conversation = {
  user: ChatUser;
  lastMessage: { content: string; createdAt: string; fromMe: boolean };
  unread: number;
};
type ChatMessage = { id: string; content: string; fromMe: boolean; readAt?: string | null; createdAt: string };

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function Avatar({ user, size = 38 }: { user: ChatUser; size?: number }) {
  return user.avatarUrl ? (
    <img src={user.avatarUrl} alt="" style={{ width: size, height: size, borderRadius: size * 0.28, objectFit: "cover", flex: "none" }} />
  ) : (
    <span style={{ width: size, height: size, borderRadius: size * 0.28, background: "linear-gradient(135deg,var(--brand),var(--rose))", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: size * 0.4, flex: "none" }}>
      {user.handle.charAt(0).toUpperCase()}
    </span>
  );
}

function MessagesInner() {
  const searchParams = useSearchParams();
  const deepLink = searchParams.get("with");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convosLoaded, setConvosLoaded] = useState(false);
  const [active, setActive] = useState<string | null>(deepLink);
  const [activeUser, setActiveUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoaded, setChatLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const loadConversations = useCallback(() => {
    apiFetch(`${API_URL}/messages`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) { setConversations(d.conversations || []); } })
      .catch(() => {})
      .finally(() => setConvosLoaded(true));
  }, []);

  const loadChat = useCallback((handle: string) => {
    apiFetch(`${API_URL}/messages/${encodeURIComponent(handle)}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setActiveUser(d.user);
        setMessages(d.messages || []);
        // Reading the thread clears unread state server-side → refresh both badges.
        setConversations((prev) => prev.map((c) => (c.user.handle === handle ? { ...c, unread: 0 } : c)));
        window.dispatchEvent(new Event("cv:refresh-messages"));
        window.dispatchEvent(new Event("cv:refresh-notifications"));
      })
      .catch(() => {})
      .finally(() => setChatLoaded(true));
  }, []);

  // Conversation list: initial load + poll.
  useEffect(() => {
    loadConversations();
    const id = setInterval(loadConversations, POLL_MS);
    return () => clearInterval(id);
  }, [loadConversations]);

  // Active chat: load on switch + poll.
  useEffect(() => {
    if (!active) return;
    setChatLoaded(false);
    setActiveUser(null);
    stickToBottom.current = true;
    loadChat(active);
    const id = setInterval(() => loadChat(active), POLL_MS);
    return () => clearInterval(id);
  }, [active, loadChat]);

  // Track whether the user is scrolled to the bottom (avoid scroll-jumping).
  const onThreadScroll = () => {
    const el = threadRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  // Autoscroll only when pinned to bottom.
  useEffect(() => {
    const el = threadRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = async () => {
    const content = draft.trim();
    if (!content || !active || sending) return;
    setSending(true);
    setDraft("");
    try {
      const res = await apiFetch(`${API_URL}/messages/${encodeURIComponent(active)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const d = await res.json();
        stickToBottom.current = true;
        setMessages((prev) => [...prev, d.message]);
        loadConversations();
      } else {
        setDraft(content); // restore on failure
      }
    } catch {
      setDraft(content);
    } finally {
      setSending(false);
    }
  };

  const visible = filter
    ? conversations.filter((c) =>
        (c.user.displayName || "").toLowerCase().includes(filter.toLowerCase()) ||
        c.user.handle.toLowerCase().includes(filter.toLowerCase()))
    : conversations;

  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r)", display: "grid", gridTemplateColumns: "320px 1fr", overflow: "hidden", height: "calc(100vh - 150px)", minHeight: 420 }}>
      {/* ——— Left pane: conversations ——— */}
      <div style={{ borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ padding: "14px 14px 10px" }}>
          <div className="search" style={{ width: "100%", marginLeft: 0 }}>
            <svg className="ico sm" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.7" y2="16.7"/></svg>
            <input placeholder="Search conversations" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {!convosLoaded ? (
            <div style={{ padding: "24px 14px", textAlign: "center", color: "var(--faint)", fontSize: 13 }}>Loading…</div>
          ) : visible.length === 0 ? (
            <div style={{ padding: "36px 18px", textAlign: "center", color: "var(--muted)", fontSize: 13.5, lineHeight: 1.6 }}>
              {conversations.length === 0 ? (
                <>No conversations yet.<br />Visit a <Link href="/dashboard" style={{ color: "var(--brand-d)", fontWeight: 600 }}>profile</Link> and hit <b>Message</b> to start one.</>
              ) : (
                "No matches."
              )}
            </div>
          ) : (
            visible.map((c) => (
              <button
                key={c.user.id}
                onClick={() => setActive(c.user.handle)}
                style={{
                  display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left",
                  padding: "11px 14px", border: 0, cursor: "pointer", font: "inherit",
                  background: active === c.user.handle ? "var(--brand-soft)" : "transparent",
                  borderLeft: active === c.user.handle ? "3px solid var(--brand)" : "3px solid transparent",
                }}
              >
                <Avatar user={c.user} size={40} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <b style={{ fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.user.displayName || c.user.handle}</b>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--faint)", fontFamily: "var(--mono)", flex: "none" }}>{timeAgo(c.lastMessage.createdAt)}</span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 12.5, color: c.unread > 0 ? "var(--ink)" : "var(--muted)", fontWeight: c.unread > 0 ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.lastMessage.fromMe ? "You: " : ""}{c.lastMessage.content}
                    </span>
                    {c.unread > 0 && (
                      <span style={{ marginLeft: "auto", flex: "none", minWidth: 17, height: 17, padding: "0 5px", borderRadius: 9, background: "var(--brand)", color: "#fff", fontSize: 10.5, fontWeight: 700, display: "grid", placeItems: "center" }}>
                        {c.unread > 9 ? "9+" : c.unread}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ——— Right pane: thread ——— */}
      {!active ? (
        <div style={{ display: "grid", placeItems: "center", color: "var(--muted)" }}>
          <div style={{ textAlign: "center", padding: 24 }}>
            <div style={{ width: 64, height: 64, margin: "0 auto 14px", borderRadius: 18, background: "var(--brand-soft)", display: "grid", placeItems: "center" }}>
              <svg viewBox="0 0 24 24" style={{ width: 28, height: 28, fill: "none", stroke: "var(--brand)", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}><path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/><polyline points="3.5 7 12 13 20.5 7"/></svg>
            </div>
            <b style={{ fontSize: 15 }}>Select a conversation</b>
            <p style={{ fontSize: 13, marginTop: 4 }}>Choose a chat from the left, or message someone from their profile.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Chat header */}
          <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 18px", borderBottom: "1px solid var(--border)" }}>
            {activeUser ? (
              <>
                <Avatar user={activeUser} size={36} />
                <Link href={`/u/${activeUser.handle}`} style={{ minWidth: 0 }}>
                  <b style={{ display: "block", fontSize: 14 }}>{activeUser.displayName || activeUser.handle}</b>
                  <span style={{ fontSize: 11.5, color: "var(--muted)", fontFamily: "var(--mono)" }}>@{activeUser.handle}</span>
                </Link>
                <Link href={`/u/${activeUser.handle}`} className="btn" style={{ marginLeft: "auto", padding: "6px 12px", fontSize: 12.5, border: "1px solid var(--border-2)", background: "#fff" }}>
                  View profile
                </Link>
              </>
            ) : (
              <span style={{ fontSize: 13, color: "var(--faint)" }}>Loading…</span>
            )}
          </div>

          {/* Thread */}
          <div ref={threadRef} onScroll={onThreadScroll} style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 6, background: "var(--paper)" }}>
            {!chatLoaded ? (
              <div style={{ margin: "auto", color: "var(--faint)", fontSize: 13 }}>Loading…</div>
            ) : messages.length === 0 ? (
              <div style={{ margin: "auto", textAlign: "center", color: "var(--muted)", fontSize: 13.5 }}>
                No messages yet — say hi 👋
              </div>
            ) : (
              messages.map((m, i) => {
                const showDay = i === 0 || dayLabel(messages[i - 1].createdAt) !== dayLabel(m.createdAt);
                return (
                  <div key={m.id} style={{ display: "contents" }}>
                    {showDay && (
                      <div style={{ textAlign: "center", margin: "10px 0 6px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--faint)", background: "#fff", border: "1px solid var(--border)", borderRadius: 999, padding: "3px 10px" }}>{dayLabel(m.createdAt)}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: m.fromMe ? "flex-end" : "flex-start" }}>
                      <div
                        style={{
                          maxWidth: "72%", padding: "9px 13px", fontSize: 13.5, lineHeight: 1.45,
                          whiteSpace: "pre-wrap", overflowWrap: "anywhere",
                          borderRadius: m.fromMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                          background: m.fromMe ? "var(--brand)" : "#fff",
                          color: m.fromMe ? "#fff" : "var(--ink)",
                          border: m.fromMe ? "1px solid var(--brand)" : "1px solid var(--border)",
                        }}
                      >
                        {m.content}
                        <div style={{ fontSize: 10, marginTop: 3, textAlign: "right", color: m.fromMe ? "rgba(255,255,255,.75)" : "var(--faint)" }}>
                          {clockTime(m.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Composer */}
          <div style={{ display: "flex", gap: 10, padding: "12px 16px", borderTop: "1px solid var(--border)", background: "#fff" }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={`Message @${active}`}
              maxLength={2000}
              style={{ flex: 1, border: "1px solid var(--border-2)", borderRadius: 999, padding: "11px 16px", font: "inherit", fontSize: 14, outline: "none", background: "var(--paper)" }}
            />
            <button
              onClick={send}
              disabled={!draft.trim() || sending}
              aria-label="Send message"
              style={{
                width: 42, height: 42, borderRadius: "50%", border: 0, cursor: draft.trim() ? "pointer" : "default",
                background: draft.trim() ? "var(--brand)" : "var(--border-2)", color: "#fff",
                display: "grid", placeItems: "center", transition: ".15s", flex: "none",
              }}
            >
              <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: "var(--faint)", fontSize: 13 }}>Loading…</div>}>
      <MessagesInner />
    </Suspense>
  );
}
