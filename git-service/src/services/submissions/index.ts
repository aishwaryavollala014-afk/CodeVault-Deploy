import type { PlatformName } from '../../types';
import type { SubmissionAdapter } from '../../types/sync.types';
import { leetcodeSubmissionAdapter } from './leetcode.service';
import { codeforcesSubmissionAdapter } from './codeforces.service';
import { codechefSubmissionAdapter } from './codechef.service';
import { hackerrankSubmissionAdapter } from './hackerrank.service';

// Registry mapping a platform to its submission adapter. Add a platform later = add one entry.
const adapters: Record<PlatformName, SubmissionAdapter> = {
  leetcode: leetcodeSubmissionAdapter,
  codeforces: codeforcesSubmissionAdapter,
  codechef: codechefSubmissionAdapter,
  hackerrank: hackerrankSubmissionAdapter,
};

export function getSubmissionAdapter(platform: PlatformName): SubmissionAdapter {
  return adapters[platform];
}

export { adapters };
