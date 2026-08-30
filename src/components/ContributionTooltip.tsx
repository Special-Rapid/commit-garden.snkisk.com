import { formatDate } from '../lib/dates';
import { gardenLabels, plantForContribution } from '../lib/garden';
import type { ContributionDay } from '../lib/types';
import { usePreferences } from '../lib/preferences';

export function ContributionTooltip({ day }: { day: ContributionDay | null }) {
  const { locale } = usePreferences();
  const ja = locale === 'ja';
  if (!day) return <p className="tooltip empty">{ja ? '区画を選ぶと、その日の記録を見られます。' : 'Choose a plot to see its day.'}</p>;
  const plant = plantForContribution(day);
  const label = ja ? { soil: '乾いた土', sprout: '芽', grass: '草', flower: '花', bush: '低木', tree: '木' }[plant] : gardenLabels[plant];
  return <div className="tooltip" aria-live="polite"><strong>{formatDate(day.date, locale)}</strong><span>{ja ? `${day.count}件のContribution` : `${day.count} contribution${day.count === 1 ? '' : 's'}`} · {label}</span></div>;
}
