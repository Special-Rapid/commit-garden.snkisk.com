import { gardenLabels, plantForContribution } from '../lib/garden';
import type { ContributionDay } from '../lib/types';
import { usePreferences } from '../lib/preferences';

export function GardenPlot({ day, selected, onSelect }: { day: ContributionDay; selected: boolean; onSelect: (day: ContributionDay) => void }) {
  const { locale } = usePreferences();
  const plant = plantForContribution(day);
  const label = locale === 'ja' ? { soil: '乾いた土', sprout: '芽', grass: '草', flower: '花', bush: '低木', tree: '木' }[plant] : gardenLabels[plant];
  return <button type="button" tabIndex={-1} className={`garden-plot plant-${plant}${selected ? ' selected' : ''}`} onClick={() => onSelect(day)} onMouseEnter={() => onSelect(day)} aria-label={locale === 'ja' ? `${day.date}、${day.count}件のContribution、${label}` : `${day.date}, ${day.count} contributions, ${label}`} />;
}
