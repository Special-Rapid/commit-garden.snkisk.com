import type { ContributionDay } from './types.ts';
import { weekdayLabels } from './dates.ts';

export type ContributionWeek = { contributionDays: ContributionDay[] };

export function flattenContributionWeeks(weeks: ContributionWeek[]): ContributionDay[] {
  return weeks.flatMap((week) => week.contributionDays).sort((a, b) => a.date.localeCompare(b.date));
}

export function calculateCurrentStreak(days: ContributionDay[]): number {
  let streak = 0;
  for (let index = days.length - 1; index >= 0 && days[index].count > 0; index -= 1) streak += 1;
  return streak;
}

export function calculateLongestStreak(days: ContributionDay[]): number {
  let longest = 0;
  let current = 0;
  for (const day of days) {
    current = day.count > 0 ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  return longest;
}

export function calculateAveragePerDay(totalContributions: number, days: ContributionDay[]): number {
  return days.length === 0 ? 0 : Number((totalContributions / days.length).toFixed(2));
}

export function calculateDryDays(days: ContributionDay[]): number {
  return days.filter((day) => day.count === 0).length;
}

export function calculateMostContributionDay(days: ContributionDay[]): { date: string; count: number } | null {
  return days.reduce<{ date: string; count: number } | null>((most, day) => {
    if (!most || day.count >= most.count) return { date: day.date, count: day.count };
    return most;
  }, null);
}

export function calculateMostActiveWeekday(days: ContributionDay[]) {
  const totals = Array.from({ length: 7 }, () => 0);
  days.forEach((day) => { totals[day.weekday] += day.count; });
  if (days.length === 0 || totals.every((total) => total === 0)) return null;
  const weekday = totals.reduce((winner, total, index) => (total > totals[winner] ? index : winner), 0);
  return { weekday, label: weekdayLabels[weekday], total: totals[weekday] };
}
