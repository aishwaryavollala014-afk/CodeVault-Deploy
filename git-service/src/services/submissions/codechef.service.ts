import { UpstreamError } from '../../utils/errors';
import type { Submission, Question, SubmissionAdapter } from '../../types/sync.types';

/** Path B — CodeChef code sync requires authed page scraping; degrades for now. */
export const codechefSubmissionAdapter: SubmissionAdapter = {
  platform: 'codechef',
  async fetchAcceptedSubmissions(): Promise<Submission[]> {
    throw new UpstreamError('CodeChef code sync not yet available');
  },
  async fetchSubmissionCode(): Promise<string> {
    throw new UpstreamError('CodeChef code sync not yet available');
  },
  async fetchQuestion(): Promise<Question> {
    throw new UpstreamError('CodeChef code sync not yet available');
  },
};
