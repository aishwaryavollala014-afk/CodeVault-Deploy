import { httpClient } from '../../lib/httpClient';
import { ExpiredSessionError, UpstreamError } from '../../utils/errors';
import type {
  Submission,
  Question,
  SubmissionAdapter,
  Difficulty,
} from '../../types/sync.types';

const ENDPOINT = 'https://leetcode.com/graphql';

/** The stored sync token is the user's `LEETCODE_SESSION` cookie value. */
function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Referer: 'https://leetcode.com',
    Cookie: `LEETCODE_SESSION=${token}`,
  };
}

const mapDifficulty = (d?: string): Difficulty | undefined => {
  const k = d?.toLowerCase();
  return k === 'easy' || k === 'medium' || k === 'hard' ? (k as Difficulty) : undefined;
};

/** Path B — authorized LeetCode submission + code + question fetch. */
export const leetcodeSubmissionAdapter: SubmissionAdapter = {
  platform: 'leetcode',

  async fetchAcceptedSubmissions(token: string): Promise<Submission[]> {
    const query = `query submissions($offset: Int!, $limit: Int!) {
      submissionList(offset: $offset, limit: $limit) {
        submissions { id title titleSlug statusDisplay lang timestamp }
      }
    }`;
    const seen = new Map<string, Submission>();
    try {
      for (let offset = 0; offset < 1000; offset += 20) {
        const res = await httpClient.post(
          ENDPOINT,
          { query, variables: { offset, limit: 20 } },
          { headers: authHeaders(token) },
        );
        if (res.status === 401 || res.status === 403) throw new ExpiredSessionError();
        const list = res.data?.data?.submissionList?.submissions ?? [];
        if (list.length === 0) break;
        for (const s of list) {
          if (s.statusDisplay !== 'Accepted' || seen.has(s.titleSlug)) continue;
          seen.set(s.titleSlug, {
            slug: s.titleSlug,
            number: s.titleSlug,
            title: s.title,
            topics: [],
            language: s.lang,
            submissionId: String(s.id),
            solvedAt: s.timestamp ? new Date(Number(s.timestamp) * 1000).toISOString() : undefined,
          });
        }
      }
    } catch (err) {
      if (err instanceof ExpiredSessionError) throw err;
      throw new UpstreamError('LeetCode submission fetch failed');
    }
    return [...seen.values()];
  },

  async fetchSubmissionCode(token: string, submission: Submission): Promise<string> {
    const query = `query detail($id: Int!) { submissionDetails(submissionId: $id) { code } }`;
    const res = await httpClient.post(
      ENDPOINT,
      { query, variables: { id: Number(submission.submissionId) } },
      { headers: authHeaders(token) },
    );
    const code = res.data?.data?.submissionDetails?.code;
    if (!code) throw new UpstreamError('LeetCode code unavailable');
    return code;
  },

  async fetchQuestion(_handle: string, slug: string): Promise<Question> {
    const query = `query q($slug: String!) {
      question(titleSlug: $slug) { questionFrontendId title content difficulty topicTags { name } }
    }`;
    const res = await httpClient.post(
      ENDPOINT,
      { query, variables: { slug } },
      { headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' } },
    );
    const q = res.data?.data?.question;
    if (!q) throw new UpstreamError('LeetCode question unavailable');
    return {
      slug,
      title: `${q.questionFrontendId}. ${q.title}`,
      contentMarkdown: q.content ?? '',
      tags: (q.topicTags ?? []).map((t: { name: string }) => t.name),
      url: `https://leetcode.com/problems/${slug}/`,
    };
  },
};

export const leetcodeDifficulty = mapDifficulty;
