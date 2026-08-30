import { useState } from 'react';
import { plantForContribution, type GardenPlant } from '../lib/garden';
import type { ContributionDay } from '../lib/types';
import { ContributionTooltip } from './ContributionTooltip';
import { usePreferences } from '../lib/preferences';

const plantAssets: Record<Exclude<GardenPlant, 'soil'>, string> = {
  sprout: '/assets/soil-sprout.png',
  grass: '/assets/grass-tuft.png',
  flower: '/assets/grass-flower.png',
  bush: '/assets/flowering-shrub.png',
  tree: '/assets/tree.png',
};

function plantScale(index: number, plant: GardenPlant) {
  const base: Record<GardenPlant, number> = { soil: 1, sprout: 0.72, grass: 0.84, flower: 0.96, bush: 1, tree: 1 };
  return base[plant] + ((index * 17) % 5) * 0.06;
}

type WeeklyPlant = { week: number; plant: GardenPlant; weekday: number };

function makeWeeklyPlants(days: ContributionDay[], leadingBlanks: number): WeeklyPlant[] {
  const weeks = Array.from({ length: 53 }, () => [] as ContributionDay[]);
  days.forEach((day, index) => weeks[Math.floor((index + leadingBlanks) / 7)]?.push(day));
  return weeks.map((weekDays, week) => {
    const total = weekDays.reduce((sum, day) => sum + day.count, 0);
    const peak = weekDays.reduce((best, day) => day.count > best.count ? day : best, weekDays[0]);
    return { week, plant: plantForContribution({ count: Math.round(total / Math.max(weekDays.length, 1)), level: 'NONE' }), weekday: peak?.weekday ?? 3 };
  });
}

export function GardenGrid({ days }: { days: ContributionDay[] }) {
  const { locale } = usePreferences();
  const ja = locale === 'ja';
  const [selected, setSelected] = useState<ContributionDay | null>(days.at(-1) ?? null);
  const leadingBlanks = days[0]?.weekday ?? 0;
  const weeklyPlants = makeWeeklyPlants(days, leadingBlanks);
  const labels = ja ? ['乾いた土', '芽', '草', '花', '低木', '木'] : ['Dry soil', 'Sprout', 'Grass', 'Flower', 'Bush', 'Tree'];
  const selectAt = (x: number, y: number) => { const week = Math.min(52, Math.floor(x * 53)); const weekday = Math.min(6, Math.floor(y * 7)); setSelected(days[Math.max(0, Math.min(days.length - 1, week * 7 + weekday - leadingBlanks))] ?? null); };
  const selectedIndex = Math.max(0, days.findIndex((day) => day.date === selected?.date));
  return <section className="garden-section" aria-labelledby="garden-heading"><div className="section-heading"><div><p className="eyebrow">{ja ? '過去365日' : 'Past 365 days'}</p><h2 id="garden-heading">{ja ? 'Contributionの流れ' : 'Contribution landscape'}</h2></div><ContributionTooltip day={selected} /></div><p className="grid-instruction">{ja ? '1年の活動を、ひとつながりの庭として眺められます。庭に触れると日付と件数を確認できます。' : 'A year of activity becomes one continuous garden. Touch the garden to check a day.'}</p><div className="garden-canvas" role="slider" tabIndex={0} aria-valuemin={0} aria-valuemax={Math.max(0, days.length - 1)} aria-valuenow={selectedIndex} aria-valuetext={selected ? `${selected.date}, ${selected.count}` : undefined} aria-label={ja ? 'Contributionの庭。矢印キーで日付を移動' : 'Contribution garden. Use arrow keys to move through days.'} onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); selectAt((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height); }} onKeyDown={(event) => { const next = event.key === 'Home' ? 0 : event.key === 'End' ? days.length - 1 : event.key === 'ArrowRight' || event.key === 'ArrowDown' ? selectedIndex + 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? selectedIndex - 1 : null; if (next !== null) { event.preventDefault(); setSelected(days[Math.max(0, Math.min(days.length - 1, next))] ?? null); } }}><div className="garden-plants" aria-hidden="true">{weeklyPlants.map(({ week, plant, weekday }) => plant === 'soil' ? null : <img key={week} src={plantAssets[plant]} className={`plant-art plant-art-${plant}`} style={{ left: `${((week + .5) / 53) * 100}%`, bottom: `${6 + weekday * 2.4}%`, transform: `translateX(-50%) scale(${plantScale(week, plant)}) rotate(${(week % 5 - 2) * 3}deg)` }} alt="" />)}</div></div><div className="garden-legend" aria-label={ja ? '庭の凡例' : 'Garden key'}>{[['soil', '·'], ['sprout', '⌁'], ['grass', '♧'], ['flower', '✿'], ['bush', '♣'], ['tree', '♠']].map(([plant, mark], index) => <span key={plant}><i className={`plant-${plant}`}>{mark}</i>{labels[index]}</span>)}</div></section>;
}
