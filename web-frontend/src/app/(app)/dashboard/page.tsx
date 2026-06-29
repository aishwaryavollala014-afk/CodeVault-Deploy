"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileHeader } from "@/components/dashboard/ProfileHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { DifficultyRing } from "@/components/dashboard/DifficultyRing";
import { PlatformList } from "@/components/dashboard/PlatformList";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { BadgesList } from "@/components/dashboard/BadgesList";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; githubLogin: string; displayName: string | null } | null>(null);

  useEffect(() => {
    // Check if the user is logged in
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
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading dashboard...</div>;
  }

  return (
    <>
      <ProfileHeader user={user} />
      
      <div className="stats">
        <StatCard 
          label="Total Solved" 
          icon={<svg className="ico" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>} 
          value="265" 
          delta="+12 this week" 
        />
        <StatCard 
          label="Current Streak" 
          icon={<svg className="ico a" viewBox="0 0 24 24"><path d="M12 3c0 3-4 4-4 8a4 4 0 0 0 8 0c0-1.5-1-2.8-1-2.8S16 12 16 14"/><path d="M12 21a6 6 0 0 0 6-6c0-5-6-12-6-12"/></svg>} 
          value="14 Days" 
          delta="Keep it going!" 
          deltaClass="warm"
        />
        <StatCard 
          label="Submissions" 
          icon={<svg className="ico" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>} 
          value="1,402" 
        />
        <StatCard 
          label="GitHub Repo" 
          icon={<svg className="ico r" viewBox="0 0 24 24"><path d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.3 2.8 5.3 3.1 5.3 3.1a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 3.9 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/></svg>} 
          value="In Sync" 
          delta="Last updated 2h ago" 
          deltaClass="pink"
        />
      </div>

      <div className="grid g-3">
        <DifficultyRing />
        <ActivityHeatmap />
      </div>

      <div className="grid g-3">
        <PlatformList />
        <RecentActivity />
      </div>
      
      <div className="grid g-2">
        <BadgesList />
        {/* Placeholder for more components */}
        <div className="panel">
          <div className="h">Topics & Tags</div>
          <div className="chips2" style={{ marginTop: "16px" }}>
            <div className="tchip"><b>32</b> Arrays</div>
            <div className="tchip"><b>24</b> Dynamic Programming</div>
            <div className="tchip"><b>18</b> Graphs</div>
            <div className="tchip"><b>12</b> Trees</div>
            <div className="tchip"><b>8</b> Math</div>
          </div>
        </div>
      </div>
    </>
  );
}
