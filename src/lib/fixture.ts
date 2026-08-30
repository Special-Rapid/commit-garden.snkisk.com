import { calculateAveragePerDay, calculateCurrentStreak, calculateDryDays, calculateLongestStreak, calculateMostActiveWeekday, calculateMostContributionDay } from './stats';
import type { CommitGardenResponse, ContributionDay } from './types';

function seededCount(day: number): number {
  const wave = Math.abs(Math.sin(day * 13.17) * 10000) % 1;
  if (wave < 0.38) return 0;
  if (wave < 0.62) return 1 + Math.floor(wave * 3);
  if (wave < 0.82) return 3 + Math.floor(wave * 8);
  if (wave < 0.95) return 10 + Math.floor(wave * 14);
  return 24 + Math.floor(wave * 17);
}

export function createDemoData(): CommitGardenResponse {
  const today = new Date();
  const days: ContributionDay[] = Array.from({ length: 365 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (364 - index));
    const count = index > 358 ? 3 + (index % 4) : seededCount(index);
    return { date: date.toISOString().slice(0, 10), count, weekday: date.getUTCDay(), level: count === 0 ? 'NONE' : count < 4 ? 'FIRST_QUARTILE' : count < 10 ? 'SECOND_QUARTILE' : count < 20 ? 'THIRD_QUARTILE' : 'FOURTH_QUARTILE', color: '#7fb069' };
  });
  const totalContributions = days.reduce((sum, day) => sum + day.count, 0);
  return {
    user: { login: 'octavia-garden', name: 'Octavia Garden', avatarUrl: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png', url: 'https://github.com/octavia-garden' },
    range: { from: days[0].date, to: days.at(-1)?.date ?? '', days: days.length },
    calendar: { totalContributions, days },
    stats: { currentStreak: calculateCurrentStreak(days), longestStreak: calculateLongestStreak(days), averagePerDay: calculateAveragePerDay(totalContributions, days), mostContributionDay: calculateMostContributionDay(days), mostActiveWeekday: calculateMostActiveWeekday(days), dryDays: calculateDryDays(days) },
  };
}
