import { useState } from 'react';
import { gardenWeekdayAt } from '../lib/garden-renderer';
import type { ContributionDay } from '../lib/types';
import { GardenCanvas } from './GardenCanvas';
import { ContributionTooltip } from './ContributionTooltip';
import { usePreferences } from '../lib/preferences';

export function GardenGrid({ days }: { days: ContributionDay[] }) {
  const { locale } = usePreferences();
  const ja = locale === 'ja';
  const [selected, setSelected] = useState<ContributionDay | null>(days.at(-1) ?? null);
  const leadingBlanks = days[0]?.weekday ?? 0;
  const labels = ja ? ['乾いた土', '芽', '草', '花', '低木', '木'] : ['Dry soil', 'Sprout', 'Grass', 'Flower', 'Bush', 'Tree'];
  const selectedIndex = Math.max(0, days.findIndex((day) => day.date === selected?.date));
  const selectAt = (x: number, y: number) => {
    const week = Math.min(52, Math.floor(x * 53));
    const weekday = gardenWeekdayAt(y);
    setSelected(days[Math.max(0, Math.min(days.length - 1, week * 7 + weekday - leadingBlanks))] ?? null);
  };
  const moveSelection = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? days.length - 1 : event.key === 'ArrowRight' || event.key === 'ArrowDown' ? selectedIndex + 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? selectedIndex - 1 : null;
    if (next === null) return;
    event.preventDefault();
    setSelected(days[Math.max(0, Math.min(days.length - 1, next))] ?? null);
  };

  return <section className="garden-section" aria-labelledby="garden-heading"><div className="section-heading"><div><p className="eyebrow">{ja ? '過去365日' : 'Past 365 days'}</p><h2 id="garden-heading">{ja ? 'Contributionの流れ' : 'Contribution landscape'}</h2></div><ContributionTooltip day={selected} /></div><p className="grid-instruction">{ja ? '日別の活動が、乾いた土から草花や木まで続く庭になります。庭に触れると日付と件数を確認できます。' : 'Daily activity becomes a continuous garden, from dry soil to trees. Touch the garden to check a day.'}</p><div className="garden-canvas" role="slider" tabIndex={0} aria-valuemin={0} aria-valuemax={Math.max(0, days.length - 1)} aria-valuenow={selectedIndex} aria-valuetext={selected ? `${selected.date}, ${selected.count}` : undefined} aria-label={ja ? 'Contributionの庭。矢印キーで日付を移動' : 'Contribution garden. Use arrow keys to move through days.'} onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); selectAt((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height); }} onKeyDown={moveSelection}><GardenCanvas days={days} leadingBlanks={leadingBlanks} selected={selected} /></div><div className="garden-legend" aria-label={ja ? '庭の凡例' : 'Garden key'}>{[['soil', '·'], ['sprout', '⌁'], ['grass', '♧'], ['flower', '✿'], ['bush', '♣'], ['tree', '♠']].map(([plant, mark], index) => <span key={plant}><i className={`plant-${plant}`}>{mark}</i>{labels[index]}</span>)}</div></section>;
}
