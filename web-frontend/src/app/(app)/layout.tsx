"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; githubLogin: string; displayName: string | null; avatarUrl?: string } | null>(null);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  if (!user) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>;
  }

  return (
    <div className="app">
      {/* SIDEBAR */}
      <div className="side">
        <Link href="/" className="brand">
          <div className="mark">CV</div> CodeVault
        </Link>
        <div className="nav">
          <Link href="/dashboard" className="active">
            <svg className="ico" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
            Overview
          </Link>
          <Link href="/repositories">
            <svg className="ico" viewBox="0 0 24 24"><polyline points="9 8 5 12 9 16"/><polyline points="15 8 19 12 15 16"/></svg>
            Repositories
          </Link>
          <Link href="/analytics">
            <svg className="ico" viewBox="0 0 24 24"><line x1="4" y1="20" x2="4" y2="11"/><line x1="10" y1="20" x2="10" y2="4"/><line x1="16" y1="20" x2="16" y2="14"/><line x1="3" y1="20" x2="21" y2="20"/></svg>
            Analytics
          </Link>
          <Link href={`/u/${user.githubLogin}`}>
            <svg className="ico" viewBox="0 0 24 24"><circle cx="12" cy="9" r="3.2"/><path d="M5.5 20c.7-3 3.3-5 6.5-5s5.8 2 6.5 5"/></svg>
            Public Profile
          </Link>
        </div>
        <div className="side-foot">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.githubLogin} className="av" style={{ border: "none" }} />
          ) : (
            <div className="av">{(user.displayName || user.githubLogin).charAt(0).toUpperCase()}</div>
          )}
          <div className="who">
            <b>{user.displayName || user.githubLogin}</b>
            <span>Free Plan</span>
          </div>
          <button className="out" title="Sign out" onClick={handleLogout}>
            <svg className="ico sm" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="main">
        {/* TOPBAR */}
        <div className="topbar">
          <div className="menu-btn">
            <svg className="ico" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </div>
          <h1>Dashboard</h1>
          <div className="search">
            <svg className="ico sm" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.7" y2="16.7"/></svg>
            <input type="text" placeholder="Search problems or platforms..." />
          </div>
          <button className="ic-btn" title="Sync Settings">
            <svg className="ico" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><polyline points="21 3 21 9 15 9"/></svg>
          </button>
          <button className="ic-btn" title="Notifications">
            <svg className="ico" viewBox="0 0 24 24"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
          </button>
        </div>

        {/* CONTENT */}
        <div className="content">
          {children}
        </div>
      </div>
      <div className="scrim"></div>
    </div>
  );
}
