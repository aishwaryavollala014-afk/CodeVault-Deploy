import type { Metadata } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  let displayName = username;
  let description = `View ${username}'s competitive programming profile on CodeVault.`;
  let totalSolved: number | undefined;
  let platformCount = 0;

  try {
    const res = await fetch(`${API_URL}/public/${username}`, {
      next: { revalidate: 900 }, // ISR: revalidate every 15 min
    });

    if (res.ok) {
      const data = await res.json();
      displayName = data?.user?.displayName || username;
      totalSolved = data?.stats?.totalSolved;
      platformCount = Object.keys(data?.stats?.platforms || {}).length;

      if (totalSolved !== undefined && totalSolved > 0) {
        description = `${displayName} has solved ${totalSolved.toLocaleString()} problems across ${platformCount} platform${platformCount !== 1 ? "s" : ""} on CodeVault.`;
      } else {
        description = `${displayName}'s competitive programming profile on CodeVault — LeetCode, Codeforces, CodeChef & HackerRank stats in one place.`;
      }
    }
  } catch {
    // API unreachable — use fallback metadata
  }

  const title = `${displayName} — CodeVault Profile`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `https://codevault.dev/u/${username}`,
      siteName: "CodeVault",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function PublicProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
