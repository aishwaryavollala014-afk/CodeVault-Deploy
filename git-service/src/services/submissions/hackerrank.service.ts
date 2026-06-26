import { UpstreamError } from '../../utils/errors';
import type { Submission, Question, SubmissionAdapter } from '../../types/sync.types';

/** Path B — HackerRank code sync requires authed scraping; degrades for now. */
export const hackerrankSubmissionAdapter: SubmissionAdapter = {
  platform: 'hackerrank',
  async fetchAcceptedSubmissions(): Promise<Submission[]> {
    throw new UpstreamError('HackerRank code sync not yet available');
  },
  async fetchSubmissionCode(): Promise<string> {
    throw new UpstreamError('HackerRank code sync not yet available');
  },
  async fetchQuestion(): Promise<Question> {
    throw new UpstreamError('HackerRank code sync not yet available');
  },
};
