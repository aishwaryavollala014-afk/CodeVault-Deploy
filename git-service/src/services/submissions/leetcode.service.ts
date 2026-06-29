import { httpClient } from '../../lib/httpClient';
import logger from '../../lib/logger';
import { ExpiredSessionError, UpstreamError } from '../../utils/errors';
import type { Difficulty, Question, Submission, SubmissionAdapter } from '../../types/sync.types';

const ENDPOINT = 'https://leetcode.com/graphql';

// LeetCode has no public REST API — this uses its internal GraphQL API (best-effort).
// The user's authorized LEETCODE_SESSION cookie value is passed in as `token`.
function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Referer: 'https://leetcode.com',
    Cookie: `LEETCODE_SESSION=${token}`,
  };
}

const mapDifficulty = (d?: string): Difficulty | undefined => {
  switch ((d ?? '').toLowerCase()) {
    case 'easy':
      return 'easy';
    case 'medium':
      return 'medium';
    case 'hard':
      return 'hard';
    default:
      return undefined;
  }
};

async function gql<T>(token: string, query: string, variables: Record<string, unknown>): Promise<T> {
  try {
    const res = await httpClient.post(
      ENDPOINT,
      { query, variables },
      { headers: authHeaders(token) },
    );
    if (res.data?.errors?.length) {
      throw new UpstreamError(`LeetCode GraphQL error: ${res.data.errors[0]?.message ?? 'unknown'}`);
    }
    return res.data.data as T;
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      throw new ExpiredSessionError('LeetCode session expired — reconnect required');
    }
    if (err instanceof UpstreamError || err instanceof ExpiredSessionError) throw err;
    logger.error(err, 'LeetCode GraphQL request failed');
    throw new UpstreamError('LeetCode request failed');
  }
}

const SUBMISSION_LIST = `
  query submissionList($offset: Int!, $limit: Int!) {
    submissionList(offset: $offset, limit: $limit) {
      hasNext
      submissions { id title titleSlug statusDisplay lang timestamp }
    }
  }`;

const SUBMISSION_DETAILS = `
  query submissionDetails($id: Int!) {
    submissionDetails(submissionId: $id) {
      code
      lang { name }
      question { questionFrontendId titleSlug title difficulty content topicTags { name } }
    }
  }`;

const QUESTION = `
  query question($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionFrontendId title titleSlug difficulty content topicTags { name }
    }
  }`;

interface RawSubmission {
  id: string;
  title: string;
  titleSlug: string;
  statusDisplay: string;
  lang: string;
  timestamp: string;
}

export const leetcodeSubmissionAdapter: SubmissionAdapter = {
  platform: 'leetcode',
  supportsCodeSync: true,

  async getRecentSubmissions(token, opts) {
    const limit = opts?.limit ?? 20;
    const data = await gql<{ submissionList: { submissions: RawSubmission[] } }>(
      token,
      SUBMISSION_LIST,
      { offset: 0, limit },
    );

    const accepted = (data.submissionList?.submissions ?? []).filter(
      (s) => s.statusDisplay === 'Accepted',
    );

    // Keep the latest accepted submission per problem.
    const seen = new Set<string>();
    const out: Submission[] = [];

    for (const s of accepted) {
      if (seen.has(s.titleSlug)) continue;
      seen.add(s.titleSlug);

      const detail = await gql<{
        submissionDetails: {
          code: string;
          lang: { name: string };
          question: {
            questionFrontendId: string;
            titleSlug: string;
            title: string;
            difficulty: string;
            content: string;
            topicTags: { name: string }[];
          };
        };
      }>(token, SUBMISSION_DETAILS, { id: Number(s.id) });

      const d = detail.submissionDetails;
      if (!d?.code) continue;

      out.push({
        platform: 'leetcode',
        number: d.question.questionFrontendId,
        slug: d.question.titleSlug,
        title: d.question.title,
        difficulty: mapDifficulty(d.question.difficulty),
        topics: (d.question.topicTags ?? []).map((t) => t.name),
        language: d.lang?.name ?? s.lang,
        code: d.code,
        solvedAt: new Date(Number(s.timestamp) * 1000),
        url: `https://leetcode.com/problems/${d.question.titleSlug}/`,
      });
    }

    return out;
  },

  async getQuestion(slug) {
    // Public query — no auth needed, but reuse the same client.
    const res = await httpClient.post(ENDPOINT, {
      query: QUESTION,
      variables: { titleSlug: slug },
    });
    const q = res.data?.data?.question;
    if (!q) throw new UpstreamError(`LeetCode question not found: ${slug}`);

    const question: Question = {
      slug: q.titleSlug,
      number: q.questionFrontendId,
      title: q.title,
      difficulty: mapDifficulty(q.difficulty),
      topics: (q.topicTags ?? []).map((t: { name: string }) => t.name),
      statementMarkdown: q.content ?? '', // HTML from LeetCode; converted to MD at publish time
      url: `https://leetcode.com/problems/${q.titleSlug}/`,
    };
    return question;
  },
};

export const leetcodeDifficulty = mapDifficulty;
