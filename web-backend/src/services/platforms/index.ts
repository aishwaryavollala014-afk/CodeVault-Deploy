import type { PlatformName } from '../../types';
import type { PlatformStatsProvider } from '../../types/platform.types';
import { leetcodeStatsProvider } from './leetcode.service';
import { codeforcesStatsProvider } from './codeforces.service';
import { codechefStatsProvider } from './codechef.service';
import { hackerrankStatsProvider } from './hackerrank.service';

/**
 * Registry of Path A stats providers. Adding a platform = add its adapter +
 * one entry here; nothing else changes (PLATFORM_INTEGRATION §10).
 */
const providers: Record<PlatformName, PlatformStatsProvider> = {
  leetcode: leetcodeStatsProvider,
  codeforces: codeforcesStatsProvider,
  codechef: codechefStatsProvider,
  hackerrank: hackerrankStatsProvider,
};

export function getStatsProvider(platform: PlatformName): PlatformStatsProvider {
  return providers[platform];
}
