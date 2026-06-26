import { httpClient } from '../../lib/httpClient';
import { UpstreamError, NotFoundError } from '../../utils/errors';
import type { PlatformStats, PlatformStatsProvider } from '../../types/platform.types';

const API = 'https://codeforces.com/api';

interface CfSubmission {
  verdict?: string;
  programmingLanguage: string;
  problem: { contestId?: number; index: string; name: string; rating?: number; tags: string[] };
}
interface CfUserInfo { rating?: number; maxRating?: number }

/** Path A — public Codeforces stats via the official, documented API. */
export const codeforcesStatsProvider: PlatformStatsProvider = {
  platform: 'codeforces',
  async fetchStats(username: string): Promise<PlatformStats> {
    let info: CfUserInfo | undefined;
    let submissions: CfSubmission[] = [];
    try {
      const [infoRes, statusRes] = await Promise.all([
        httpClient.get(`${API}/user.info?handles=${encodeURIComponent(username)}`),
        httpClient.get(`${API}/user.status?handle=${encodeURIComponent(username)}&from=1&count=10000`),
      ]);
      if (infoRes.data?.status !== 'OK') {
        throw new NotFoundError(`Codeforces user "${username}" not found`);
      }
      info = infoRes.data.result?.[0];
      submissions = statusRes.data?.status === 'OK' ? statusRes.data.result : [];
    } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new UpstreamError('Codeforces request failed');
    }

    // Count unique AC problems; aggregate tags + languages + difficulty by rating band.
    const solved = new Set<string>();
    const topicCounts = new Map<string, number>();
    const langCounts = new Map<string, number>();
    const difficulty = { easy: 0, medium: 0, hard: 0 };

    for (const s of submissions) {
      if (s.verdict !== 'OK') continue;
      const key = `${s.problem.contestId ?? 'x'}-${s.problem.index}`;
      if (solved.has(key)) continue;
      solved.add(key);

      langCounts.set(s.programmingLanguage, (langCounts.get(s.programmingLanguage) ?? 0) + 1);
      for (const tag of s.problem.tags) topicCounts.set(tag, (topicCounts.get(tag) ?? 0) + 1);

      const r = s.problem.rating ?? 0;
      if (r && r < 1200) difficulty.easy += 1;
      else if (r && r < 1900) difficulty.medium += 1;
      else if (r) difficulty.hard += 1;
    }

    const top = (m: Map<string, number>, n: number) =>
      [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, n);

    return {
      platform: 'codeforces',
      username,
      totalSolved: solved.size,
      byDifficulty: difficulty,
      topics: top(topicCounts, 12),
      languages: top(langCounts, 8),
      ...(info?.rating
        ? { rating: { current: info.rating, peak: info.maxRating ?? info.rating } }
        : {}),
    };
  },
};
