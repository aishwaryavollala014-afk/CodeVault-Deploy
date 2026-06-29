import logger from '../../lib/logger';
import { UpstreamError } from '../../utils/errors';
import type { Question, Submission, SubmissionAdapter } from '../../types/sync.types';

// CodeChef has no official authorized API for retrieving a user's source code, and scraping
// the authenticated submission pages is brittle + against ToS. Path B code-sync degrades here.
// Stats (Path A) are handled separately in web-backend from the public profile.
export const codechefSubmissionAdapter: SubmissionAdapter = {
  platform: 'codechef',
  supportsCodeSync: false,

  async getRecentSubmissions(_token, _opts): Promise<Submission[]> {
    logger.warn('CodeChef code-sync is not supported (no authorized code API); skipping.');
    return [];
  },

  async getQuestion(slug): Promise<Question> {
    if (!slug) throw new UpstreamError('CodeChef problem slug is required');
    const url = `https://www.codechef.com/problems/${slug}`;
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
