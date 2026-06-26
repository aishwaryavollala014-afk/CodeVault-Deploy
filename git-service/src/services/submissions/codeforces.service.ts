import { UpstreamError } from '../../utils/errors';
import type { Submission, Question, SubmissionAdapter } from '../../types/sync.types';

/**
 * Path B — Codeforces source code is not cleanly available via the official API
 * (per PLATFORM_INTEGRATION §2.3); it needs a session-based fetch of the
 * submission page. Until that lands, this adapter degrades (the dashboard still
 * shows CF *stats* via web-backend Path A). Interface is stable.
 */
export const codeforcesSubmissionAdapter: SubmissionAdapter = {
  platform: 'codeforces',
  async fetchAcceptedSubmissions(): Promise<Submission[]> {
    throw new UpstreamError('Codeforces code sync not yet available');
  },
  async fetchSubmissionCode(): Promise<string> {
    throw new UpstreamError('Codeforces code sync not yet available');
  },
  async fetchQuestion(): Promise<Question> {
    throw new UpstreamError('Codeforces code sync not yet available');
  },
};
