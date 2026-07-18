import { describe, it, expect } from 'vitest';
import { normalizeStats } from '../src/lib/stats';
import { platformColor } from '../src/lib/theme';

const nowSec = Math.floor(Date.now() / 1000);

describe('normalizeStats — empty input', () => {
  it('returns zeroed view-model when nothing is connected', () => {
    const vm = normalizeStats({ platforms: {} });
    expect(vm.totalSolved).toBe(0);
    expect(vm.connected).toEqual([]);
    expect(vm.byDifficulty).toEqual({ easy: 0, medium: 0, hard: 0 });
    expect(vm.perPlatform).toEqual([]);
    expect(vm.languages).toEqual([]);
    expect(vm.topics).toEqual([]);
    expect(vm.ratings).toEqual([]);
    expect(vm.heatmap).toEqual([]);
    expect(vm.recent).toEqual([]);
  });
});

describe('normalizeStats — LeetCode payload', () => {
  const data = {
    totalSolved: 50,
    platforms: {
      leetcode: {
        easy: 30,
        medium: 19,
        hard: 1,
        total: 50,
        languages: [
          { languageName: 'Python3', problemsSolved: 40 },
          { languageName: 'C++', problemsSolved: 10 },
        ],
        topics: {
          advanced: [{ tagName: 'Dynamic Programming', problemsSolved: 5 }],
          intermediate: [{ tagName: 'Graph', problemsSolved: 8 }],
          fundamental: [{ tagName: 'Array', problemsSolved: 20 }],
        },
        heatmap: JSON.stringify({ [nowSec]: 3 }),
        recent: [{ title: 'Two Sum', timestamp: nowSec }],
      },
    },
  };

  it('uses the provided total and lists the connected platform', () => {
    const vm = normalizeStats(data);
    expect(vm.totalSolved).toBe(50);
    expect(vm.connected).toEqual(['leetcode']);
  });

  it('sums difficulty and colors the per-platform bar', () => {
    const vm = normalizeStats(data);
    expect(vm.byDifficulty).toEqual({ easy: 30, medium: 19, hard: 1 });
    expect(vm.perPlatform).toEqual([
      { label: 'leetcode', value: 50, color: platformColor.leetcode },
    ]);
  });

  it('parses languages and topics, sorted by count descending', () => {
    const vm = normalizeStats(data);
    expect(vm.languages).toEqual([
      { label: 'Python3', value: 40 },
      { label: 'C++', value: 10 },
    ]);
    expect(vm.topics.map((t) => t.label)).toEqual(['Array', 'Graph', 'Dynamic Programming']);
    expect(vm.topics[0]).toEqual({ label: 'Array', value: 20 });
  });

  it('builds a padded 12-month heatmap reflecting the calendar', () => {
    const vm = normalizeStats(data);
    const real = vm.heatmap.filter((d) => d.count >= 0);
    const pad = vm.heatmap.filter((d) => d.count === -1);
    expect(real).toHaveLength(371); // 53 weeks
    expect(pad.length).toBeGreaterThanOrEqual(0);
    expect(pad.length).toBeLessThan(7); // leading weekday alignment only
    // today's single submission (count 3) is the only positive cell
    const positiveSum = vm.heatmap.filter((d) => d.count > 0).reduce((a, b) => a + b.count, 0);
    expect(positiveSum).toBe(3);
  });

  it('maps recent solves with platform + formatted date', () => {
    const vm = normalizeStats(data);
    expect(vm.recent[0].title).toBe('Two Sum');
    expect(vm.recent[0].platform).toBe('leetcode');
    expect(vm.recent[0].when).not.toBe('');
  });
});

describe('normalizeStats — ratings and total fallback', () => {
  it('derives totalSolved from platforms when top-level total is absent', () => {
    const vm = normalizeStats({ platforms: { codeforces: { total: 42, rating: 1500, maxRating: 1700 } } });
    expect(vm.totalSolved).toBe(42);
    expect(vm.byDifficulty).toEqual({ easy: 0, medium: 0, hard: 0 });
    expect(vm.ratings).toEqual([{ platform: 'codeforces', current: 1500, peak: 1700 }]);
  });

  it('aggregates difficulty and totals across multiple platforms', () => {
    const vm = normalizeStats({
      platforms: {
        leetcode: { total: 10, easy: 5, medium: 4, hard: 1 },
        codechef: { total: 20, easy: 8, medium: 10, hard: 2 },
      },
    });
    expect(vm.totalSolved).toBe(30);
    expect(vm.byDifficulty).toEqual({ easy: 13, medium: 14, hard: 3 });
    expect(vm.perPlatform.map((p) => p.label).sort()).toEqual(['codechef', 'leetcode']);
  });
});
