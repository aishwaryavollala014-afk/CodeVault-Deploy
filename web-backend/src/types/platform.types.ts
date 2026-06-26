import type { PlatformName } from './index';

/** Normalized public stats returned by every platform adapter (Path A). */
export interface PlatformStats {
  platform: PlatformName;
  username: string;
  totalSolved: number;
  byDifficulty: { easy: number; medium: number; hard: number };
  topics: Array<{ name: string; count: number }>;
  languages: Array<{ name: string; count: number }>;
  rating?: { current: number; peak: number };
  streak?: { current: number; longest: number };
  heatmap?: Array<{ date: string; count: number }>;
}

/** Each platform implements this — adding a platform = adding one adapter. */
export interface PlatformStatsProvider {
  readonly platform: PlatformName;
  fetchStats(username: string): Promise<PlatformStats>;
}

export type { PlatformName };
