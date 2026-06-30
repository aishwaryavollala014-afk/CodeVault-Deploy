import React from "react";

export function ProfileHeader({ user }: { user: any }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-[var(--r)] p-[22px] flex items-center gap-[18px] shadow-sm relative overflow-hidden flex-wrap max-[820px]:flex-wrap">
      <div className="absolute -right-[60px] -top-[60px] w-[180px] h-[180px] rounded-full bg-[var(--red-soft)] opacity-60"></div>
      <div className="w-[64px] h-[64px] rounded-[16px] bg-gradient-to-br from-[var(--accent)] to-[var(--rose)] text-white grid place-items-center text-[26px] font-extrabold relative z-10">{(user?.displayName || user?.githubLogin || "U").charAt(0).toUpperCase()}</div>
      <div className="relative z-10">
        <div className="text-[20px] font-extrabold tracking-[-0.01em]">{user?.displayName || user?.githubLogin}</div>
        <div className="font-mono text-[12.5px] text-[var(--accent-2)] mt-[3px]">@{user?.githubLogin}</div>
        <div className="flex gap-[7px] mt-[11px] flex-wrap">
          <div className="flex items-center gap-[7px] border border-[var(--border-2)] rounded-lg py-1 px-[9px] text-[12px] font-semibold bg-white">
            <div className="w-4 h-4 rounded-[4px] grid place-items-center text-[8px] font-extrabold font-mono text-white bg-[#ffa116]">LC</div><div className="text-[var(--faint)] font-medium font-mono text-[11px]">aishwaryav007</div>
          </div>
          <div className="flex items-center gap-[7px] border border-[var(--border-2)] rounded-lg py-1 px-[9px] text-[12px] font-semibold bg-white">
            <div className="w-4 h-4 rounded-[4px] grid place-items-center text-[8px] font-extrabold font-mono text-white bg-[#1f8acb]">CF</div><div className="text-[var(--faint)] font-medium font-mono text-[11px]">gaurav_cf</div>
          </div>
        </div>
      </div>
      <div className="ml-auto relative z-10 flex gap-2.5 max-[820px]:ml-0 max-[820px]:w-full">
        <button className="inline-flex items-center gap-2 font-semibold text-[14.5px] rounded-[10px] border border-[var(--border-2)] bg-white text-[var(--ink)] px-[18px] py-[11px] transition-colors hover:bg-[var(--subtle)] hover:border-[#cfcfda]">Share Profile</button>
        <button className="inline-flex items-center gap-2 font-semibold text-[14.5px] rounded-[10px] border border-[var(--accent)] bg-[var(--accent)] text-white px-[18px] py-[11px] transition-colors hover:bg-[var(--accent-2)]">Sync Now</button>
      </div>
    </div>
  );
}
