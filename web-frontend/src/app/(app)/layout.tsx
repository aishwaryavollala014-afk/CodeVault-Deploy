"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
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
    <>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
        <symbol id="ic-overview" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></symbol>
        <symbol id="ic-analytics" viewBox="0 0 24 24"><line x1="4" y1="20" x2="4" y2="11"/><line x1="10" y1="20" x2="10" y2="4"/><line x1="16" y1="20" x2="16" y2="14"/><line x1="3" y1="20" x2="21" y2="20"/></symbol>
        <symbol id="ic-repos" viewBox="0 0 24 24"><polyline points="9 8 5 12 9 16"/><polyline points="15 8 19 12 15 16"/></symbol>
        <symbol id="ic-profile" viewBox="0 0 24 24"><circle cx="12" cy="9" r="3.2"/><path d="M5.5 20c.7-3 3.3-5 6.5-5s5.8 2 6.5 5"/></symbol>
        <symbol id="ic-sync" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><polyline points="21 3 21 9 15 9"/></symbol>
        <symbol id="ic-settings" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2.1 2.1M16.9 16.9 19 19M19 5l-2.1 2.1M7.1 16.9 5 19"/></symbol>
        <symbol id="ic-bell" viewBox="0 0 24 24"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></symbol>
        <symbol id="ic-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.7" y2="16.7"/></symbol>
        <symbol id="ic-logout" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></symbol>
        <symbol id="ic-flame" viewBox="0 0 24 24"><path d="M12 3c0 3-4 4-4 8a4 4 0 0 0 8 0c0-1.5-1-2.8-1-2.8S16 12 16 14"/><path d="M12 21a6 6 0 0 0 6-6c0-5-6-12-6-12"/></symbol>
        <symbol id="ic-bolt" viewBox="0 0 24 24"><polygon points="13 2 4 14 11 14 10 22 20 9 13 9 13 2"/></symbol>
        <symbol id="ic-github" viewBox="0 0 24 24"><path d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.3 2.8 5.3 3.1 5.3 3.1a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 3.9 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/></symbol>
        <symbol id="ic-menu" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></symbol>
        <symbol id="ic-copy" viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></symbol>
        <symbol id="ic-plus" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></symbol>
      </svg>
      <div className="app">
      {/* SIDEBAR */}
      <div className="side">
        <Link href="/dashboard" className="brand">
          <div className="mark">CV</div> CodeVault
        </Link>
        <div className="nav">
          <Link href="/dashboard" className={pathname === "/dashboard" ? "active" : ""}>
            <svg className="ico"><use href="#ic-overview"/></svg>
            Overview
          </Link>
          <Link href="/repositories" className={pathname === "/repositories" ? "active" : ""}>
            <svg className="ico"><use href="#ic-repos"/></svg>
            Repositories
          </Link>
          <Link href="/analytics" className={pathname === "/analytics" ? "active" : ""}>
            <svg className="ico"><use href="#ic-analytics"/></svg>
            Analytics
          </Link>
          <Link href="/public-profile" className={pathname === "/public-profile" ? "active" : ""}>
            <svg className="ico"><use href="#ic-profile"/></svg>
            Public profile
          </Link>
          <Link href="/sync-status" className={pathname === "/sync-status" ? "active" : ""}>
            <svg className="ico"><use href="#ic-sync"/></svg>
            Sync status
          </Link>
          <Link href="/settings" className={pathname === "/settings" ? "active" : ""}>
            <svg className="ico"><use href="#ic-settings"/></svg>
            Settings
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
          
          {(() => {
            if (pathname === "/dashboard") {
              return (
                <>
                  <h1>Dashboard</h1>
                  <div className="search">
                    <svg className="ico sm"><use href="#ic-search"/></svg>
                    <input type="text" placeholder="Search problems or platforms..." />
                  </div>
                  <button className="ic-btn" title="Sync Settings">
                    <svg className="ico"><use href="#ic-sync"/></svg>
                  </button>
                  <button className="ic-btn" title="Notifications">
                    <svg className="ico"><use href="#ic-bell"/></svg>
                  </button>
                </>
              );
            }
            
            let title = "Dashboard";
            if (pathname === "/repositories") title = "Repositories";
            else if (pathname === "/analytics") title = "Analytics";
            else if (pathname?.startsWith("/u/")) title = "Public profile";
            else if (pathname === "/sync-status") title = "Sync status";
            else if (pathname === "/settings") title = "Settings";

            return (
              <>
                <h1>{title}</h1>
                <span className="spacer"></span>
                <button className="ic-btn" title="Notifications">
                  <svg className="ico"><use href="#ic-bell"/></svg>
                </button>
              </>
            );
          })()}
        </div>

        {/* CONTENT */}
        <div className="content">
          {children}
        </div>
      </div>
      <div className="scrim"></div>
    </div>
    </>
  );
}
