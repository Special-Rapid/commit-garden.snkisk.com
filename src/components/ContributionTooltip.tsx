import { formatDate } from '../lib/dates';
import { gardenLabels, plantForContribution } from '../lib/garden';
import type { ContributionDay } from '../lib/types';

export function ContributionTooltip({ day }: { day: ContributionDay | null }) {
  if (!day) return <p className="tooltip empty">Choose a plot to see its day.</p>;
  return <div className="tooltip" aria-live="polite"><strong>{formatDate(day.date)}</strong><span>{day.count} contribution{day.count === 1 ? '' : 's'} · {gardenLabels[plantForContribution(day)]}</span></div>;
}
