import { gardenLabels, plantForContribution } from '../lib/garden';
import type { ContributionDay } from '../lib/types';

const marks = { soil: '·', sprout: '⌁', grass: '♧', flower: '✿', bush: '♣', tree: '♠' };
export function GardenPlot({ day, selected, onSelect }: { day: ContributionDay; selected: boolean; onSelect: (day: ContributionDay) => void }) {
  const plant = plantForContribution(day);
  return <button type="button" className={`garden-plot plant-${plant}${selected ? ' selected' : ''}`} onClick={() => onSelect(day)} onFocus={() => onSelect(day)} onMouseEnter={() => onSelect(day)} aria-pressed={selected} aria-label={`${day.date}, ${day.count} contributions, ${gardenLabels[plant]}`}><span aria-hidden="true">{marks[plant]}</span></button>;
}
