import { describe, expect, it } from 'vitest';
import { decodeUsernamePathSegment } from './dates';
import { calculateAveragePerDay, calculateCurrentStreak, calculateDryDays, calculateLongestStreak, calculateMostActiveWeekday, calculateMostContributionDay, flattenContributionWeeks } from './stats';
import type { ContributionDay } from './types';

const days = (counts: number[]): ContributionDay[] => counts.map((count, index) => ({ date: `2026-01-${String(index + 1).padStart(2, '0')}`, count, level: count ? 'FIRST_QUARTILE' : 'NONE', color: '', weekday: index % 7 }));
describe('contribution stats', () => {
  it('rejects malformed username path encoding without throwing', () => expect(decodeUsernamePathSegment('%')).toBeNull());
  it('flattens and sorts calendar weeks', () => expect(flattenContributionWeeks([{ contributionDays: days([1]).map((day) => ({ ...day, date: '2026-01-02' })) }, { contributionDays: days([2]).map((day) => ({ ...day, date: '2026-01-01' })) }]).map((day) => day.date)).toEqual(['2026-01-01', '2026-01-02']));
  it('counts current streak only when the newest day is active', () => { expect(calculateCurrentStreak(days([1, 2, 0]))).toBe(0); expect(calculateCurrentStreak(days([0, 1, 2]))).toBe(2); });
  it('finds the longest streak and dry days', () => { expect(calculateLongestStreak(days([1, 1, 0, 1, 1, 1, 0]))).toBe(3); expect(calculateDryDays(days([1, 1, 0, 1, 1, 1, 0]))).toBe(2); });
  it('rounds average and chooses the newest tied peak', () => { expect(calculateAveragePerDay(10, days([1, 2, 3]))).toBe(3.33); expect(calculateMostContributionDay(days([4, 9, 9]))).toEqual({ date: '2026-01-03', count: 9 }); });
  it('sums counts per GitHub weekday', () => expect(calculateMostActiveWeekday(days([1, 1, 1, 1, 1, 9, 1]))).toEqual({ weekday: 5, label: 'Friday', total: 9 }));
  it('does not invent an active weekday for an empty garden', () => expect(calculateMostActiveWeekday(days([0, 0, 0]))).toBeNull());
});
