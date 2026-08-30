import { formatDate } from '../lib/dates';
import type { CommitGardenResponse } from '../lib/types';
import { StatCard } from './StatCard';
import { usePreferences } from '../lib/preferences';

export function StatsGrid({ calendar, stats }: Pick<CommitGardenResponse, 'calendar' | 'stats'>) {
  const { locale } = usePreferences();
  const ja = locale === 'ja';
  const days = ja ? '日' : ' days';
  return <section className="stats-grid" aria-label={ja ? 'Contributionの統計' : 'Contribution statistics'}>
    <StatCard label={ja ? '合計Contribution' : 'Total Contributions'} value={calendar.totalContributions.toLocaleString(locale === 'ja' ? 'ja-JP' : 'en')} detail={ja ? 'この1年間' : 'in this garden year'} tone="leaf" />
    <StatCard label={ja ? '現在の連続日数' : 'Current Streak'} value={`${stats.currentStreak}${days}`} detail={ja ? '連続して活動した日数' : 'consecutive active days'} tone="flower" />
    <StatCard label={ja ? '1日あたり平均' : 'Average / day'} value={stats.averagePerDay} detail={ja ? '1日ごとのContribution' : 'contributions each day'} tone="soil" />
    <StatCard label={ja ? '乾いた日' : 'Dry Days'} value={stats.dryDays} detail={ja ? 'Contributionがなかった日' : 'days with no contributions'} tone="soil" />
  </section>;
}
