import { httpClient } from '../../lib/httpClient';
import { UpstreamError, NotFoundError } from '../../utils/errors';
import type { PlatformStats, PlatformStatsProvider } from '../../types/platform.types';

const ENDPOINT = 'https://leetcode.com/graphql';

const QUERY = `
query userPublicStats($username: String!) {
  matchedUser(username: $username) {
    submitStatsGlobal { acSubmissionNum { difficulty count } }
    languageProblemCount { languageName problemsSolved }
    tagProblemCounts {
      advanced { tagName problemsSolved }
      intermediate { tagName problemsSolved }
      fundamental { tagName problemsSolved }
    }
  }
  userContestRanking(username: $username) { rating }
}`;

interface LcDiff { difficulty: 'All' | 'Easy' | 'Medium' | 'Hard'; count: number }
interface LcTag { tagName: string; problemsSolved: number }
interface LcResponse {
  data?: {
    matchedUser: {
      submitStatsGlobal: { acSubmissionNum: LcDiff[] };
      languageProblemCount: Array<{ languageName: string; problemsSolved: number }>;
      tagProblemCounts: { advanced: LcTag[]; intermediate: LcTag[]; fundamental: LcTag[] };
    } | null;
    userContestRanking: { rating: number } | null;
  };
}

/** Path A — public LeetCode stats via the internal GraphQL API (username only). */
export const leetcodeStatsProvider: PlatformStatsProvider = {
  platform: 'leetcode',
  async fetchStats(username: string): Promise<PlatformStats> {
    let body: LcResponse;
    try {
      const res = await httpClient.post<LcResponse>(
        ENDPOINT,
        { query: QUERY, variables: { username } },
        { headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' } },
      );
      body = res.data;
    } catch {
      throw new UpstreamError('LeetCode request failed');
    }

    const user = body.data?.matchedUser;
    if (!user) throw new NotFoundError(`LeetCode user "${username}" not found`);

    const diff = (d: string): number =>
      user.submitStatsGlobal.acSubmissionNum.find((x) => x.difficulty === d)?.count ?? 0;

    const tags = [
      ...user.tagProblemCounts.advanced,
      ...user.tagProblemCounts.intermediate,
      ...user.tagProblemCounts.fundamental,
    ]
      .filter((t) => t.problemsSolved > 0)
      .map((t) => ({ name: t.tagName, count: t.problemsSolved }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    const rating = body.data?.userContestRanking?.rating;

    return {
      platform: 'leetcode',
      username,
      totalSolved: diff('All'),
      byDifficulty: { easy: diff('Easy'), medium: diff('Medium'), hard: diff('Hard') },
      topics: tags,
      languages: user.languageProblemCount
        .map((l) => ({ name: l.languageName, count: l.problemsSolved }))
        .sort((a, b) => b.count - a.count),
      ...(rating ? { rating: { current: Math.round(rating), peak: Math.round(rating) } } : {}),
    };
  },
};
