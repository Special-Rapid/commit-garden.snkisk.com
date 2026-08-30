import { formatDate } from '../lib/dates';
import type { CommitGardenResponse } from '../lib/types';
import { StatCard } from './StatCard';
import { usePreferences } from '../lib/preferences';

export function StatsGrid({ calendar, stats }: Pick<CommitGardenResponse, 'calendar' | 'stats'>) {
  const { locale } = usePreferences();
  const ja = locale === 'ja';
  const peak = stats.mostContributionDay;
  const days = ja ? '日' : ' days';
  return <section className="stats-grid" aria-label={ja ? 'Contributionの統計' : 'Contribution statistics'}>
    <StatCard label={ja ? '合計Contribution' : 'Total Contributions'} value={calendar.totalContributions.toLocaleString(locale === 'ja' ? 'ja-JP' : 'en')} detail={ja ? 'この1年間' : 'in this garden year'} tone="leaf" />
    <StatCard label={ja ? '現在の連続日数' : 'Current Streak'} value={`${stats.currentStreak}${days}`} detail={ja ? '連続して活動した日数' : 'consecutive active days'} tone="flower" />
    <StatCard label={ja ? '最長連続日数' : 'Longest Streak'} value={`${stats.longestStreak}${days}`} detail={ja ? 'いちばん長い成長の連なり' : 'best growing run'} tone="leaf" />
    <StatCard label={ja ? '1日あたり平均' : 'Average / day'} value={stats.averagePerDay} detail={ja ? '1日ごとのContribution' : 'contributions each day'} tone="soil" />
    <StatCard label={ja ? '最多Contributionの日' : 'Most Contribution Day'} value={peak ? peak.count : '—'} detail={peak ? formatDate(peak.date, locale) : (ja ? 'まだ活動はありません' : 'No activity yet')} tone="flower" />
    <StatCard label={ja ? '最も活動した曜日' : 'Most Active Weekday'} value={stats.mostActiveWeekday ? (ja ? ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'][stats.mostActiveWeekday.weekday] : stats.mostActiveWeekday.label) : '—'} detail={stats.mostActiveWeekday ? (ja ? `${stats.mostActiveWeekday.total}件のContribution` : `${stats.mostActiveWeekday.total} contributions`) : (ja ? 'まだ活動はありません' : 'No activity yet')} tone="leaf" />
    <StatCard label={ja ? '乾いた日' : 'Dry Days'} value={stats.dryDays} detail={ja ? 'Contributionがなかった日' : 'days with no contributions'} tone="soil" />
  </section>;
}
