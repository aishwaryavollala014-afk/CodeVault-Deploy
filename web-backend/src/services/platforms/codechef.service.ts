import { UpstreamError } from '../../utils/errors';
import type { PlatformStats, PlatformStatsProvider } from '../../types/platform.types';

/**
 * Path A — CodeChef has no clean public stats API (profile-page scraping only,
 * per PLATFORM_INTEGRATION §3). Until the resilient HTML parser lands, this
 * adapter reports unavailable so the aggregator flags it `degraded` rather than
 * failing the whole dashboard. The interface is stable; only this body changes.
 */
export const codechefStatsProvider: PlatformStatsProvider = {
  platform: 'codechef',
  async fetchStats(_username: string): Promise<PlatformStats> {
    throw new UpstreamError('CodeChef stats not yet available');
  },
};
