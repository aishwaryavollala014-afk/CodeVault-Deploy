import React from "react";

export function ProfileHeader({ user }: { user: any }) {
  return (
    <div className="phead">
      <div className="pav">{(user?.displayName || user?.githubLogin || "U").charAt(0).toUpperCase()}</div>
      <div className="pid">
        <div className="nm">{user?.displayName || user?.githubLogin}</div>
        <div className="ln">@{user?.githubLogin}</div>
        <div className="chips">
          <div className="pchip">
            <div className="b lc">LC</div><div className="h">aishwaryav007</div>
          </div>
          <div className="pchip">
            <div className="b cf">CF</div><div className="h">gaurav_cf</div>
          </div>
        </div>
      </div>
      <div className="pa">
        <button className="btn btn-secondary">Share Profile</button>
        <button className="btn btn-primary">Sync Now</button>
      </div>
    </div>
  );
}
