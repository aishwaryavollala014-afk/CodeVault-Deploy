import { UpstreamError } from '../../utils/errors';
import type { PlatformStats, PlatformStatsProvider } from '../../types/platform.types';

/**
 * Path A — HackerRank exposes only public badge data via internal endpoints
 * (PLATFORM_INTEGRATION §4). Until the resilient parser lands, this adapter
 * reports unavailable so the aggregator flags it `degraded`. The interface is
 * stable; only this body changes when the real fetch is implemented.
 */
export const hackerrankStatsProvider: PlatformStatsProvider = {
  platform: 'hackerrank',
  async fetchStats(_username: string): Promise<PlatformStats> {
    throw new UpstreamError('HackerRank stats not yet available');
  },
};
