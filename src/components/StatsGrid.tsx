import { formatDate } from '../lib/dates';
import type { CommitGardenResponse } from '../lib/types';
import { StatCard } from './StatCard';

export function StatsGrid({ calendar, stats }: Pick<CommitGardenResponse, 'calendar' | 'stats'>) {
  const peak = stats.mostContributionDay;
  return <section className="stats-grid" aria-label="Contribution statistics">
    <StatCard label="Total Contributions" value={calendar.totalContributions.toLocaleString()} detail="in this garden year" tone="leaf" />
    <StatCard label="Current Streak" value={`${stats.currentStreak} days`} detail="consecutive active days" tone="flower" />
    <StatCard label="Longest Streak" value={`${stats.longestStreak} days`} detail="best growing run" tone="leaf" />
    <StatCard label="Average / day" value={stats.averagePerDay} detail="contributions each day" tone="soil" />
    <StatCard label="Most Contribution Day" value={peak ? peak.count : '—'} detail={peak ? formatDate(peak.date) : 'No activity yet'} tone="flower" />
    <StatCard label="Most Active Weekday" value={stats.mostActiveWeekday?.label ?? '—'} detail={stats.mostActiveWeekday ? `${stats.mostActiveWeekday.total} contributions` : 'No activity yet'} tone="leaf" />
    <StatCard label="Dry Days" value={stats.dryDays} detail="days with no contributions" tone="soil" />
  </section>;
}
