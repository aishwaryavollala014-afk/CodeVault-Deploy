import logger from '../../lib/logger';
import { UpstreamError } from '../../utils/errors';
import type { Question, Submission, SubmissionAdapter } from '../../types/sync.types';

// Codeforces' official API (user.status) returns submission METADATA but NOT source code,
// and scraping the source page violates their ToS. So Path B code-sync is NOT supported here.
// Stats (Path A) still work in web-backend via the official API. This adapter degrades safely.
export const codeforcesSubmissionAdapter: SubmissionAdapter = {
  platform: 'codeforces',
  supportsCodeSync: false,

  async getRecentSubmissions(_token, _opts): Promise<Submission[]> {
    // No legal API path to the user's source code — nothing to sync.
    logger.warn('Codeforces code-sync is not supported (API exposes no source); skipping.');
    return [];
  },

  async getQuestion(slug): Promise<Question> {
    // Problem statements are not available via the official API; provide a link only.
    // slug is expected as "<contestId><index>" e.g. "1700A".
    const m = slug.match(/^(\d+)([A-Za-z]\d?)$/);
    const url = m
      ? `https://codeforces.com/problemset/problem/${m[1]}/${m[2]}`
      : `https://codeforces.com/problemset`;
    if (!m) throw new UpstreamError(`Unrecognized Codeforces problem slug: ${slug}`);
    return {
      slug,
      number: slug,
      title: slug,
      topics: [],
      statementMarkdown: `Problem statement not available via API. See ${url}`,
      url,
    };
  },
};
