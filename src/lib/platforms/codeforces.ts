// Codeforces integration.
//
// Codeforces provides an official public API for stats and submission metadata.
// Note: the official API does NOT expose submission source code.

const CF_API = "https://codeforces.com/api";

export interface CodeforcesStats {
  handle: string;
  rating: number | null;
  maxRating: number | null;
  rank: string | null;
  solvedCount: number;
}

/**
 * Public stats for a Codeforces handle (Path A).
 */
export async function getCodeforcesStats(handle: string): Promise<CodeforcesStats> {
  const infoRes = await fetch(`${CF_API}/user.info?handles=${encodeURIComponent(handle)}`);
  const info = await infoRes.json();
  if (info.status !== "OK") throw new Error(`Codeforces user not found: ${handle}`);
  const user = info.result[0];

  // Count distinct solved problems from submission history.
  const statusRes = await fetch(
    `${CF_API}/user.status?handle=${encodeURIComponent(handle)}`,
  );
  const status = await statusRes.json();
  const solved = new Set<string>();
  if (status.status === "OK") {
    for (const sub of status.result) {
      if (sub.verdict === "OK" && sub.problem) {
        solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
      }
    }
  }

  return {
    handle: user.handle,
    rating: user.rating ?? null,
    maxRating: user.maxRating ?? null,
    rank: user.rank ?? null,
    solvedCount: solved.size,
  };
}
