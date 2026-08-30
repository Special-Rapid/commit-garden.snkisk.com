import { useState } from 'react';
import type { ContributionDay } from '../lib/types';
import { ContributionTooltip } from './ContributionTooltip';
import { GardenPlot } from './GardenPlot';
import { usePreferences } from '../lib/preferences';

export function GardenGrid({ days }: { days: ContributionDay[] }) {
  const { locale } = usePreferences();
  const ja = locale === 'ja';
  const [selected, setSelected] = useState<ContributionDay | null>(days.at(-1) ?? null);
  const selectedIndex = Math.max(0, days.findIndex((day) => day.date === selected?.date));
  const leadingBlanks = days[0]?.weekday ?? 0;
  const labels = ja ? ['乾いた土', '芽', '草', '花', '低木', '木'] : ['Dry soil', 'Sprout', 'Grass', 'Flower', 'Bush', 'Tree'];
  return <section className="garden-section" aria-labelledby="garden-heading"><div className="section-heading"><div><p className="eyebrow">{ja ? '過去365日' : 'Past 365 days'}</p><h2 id="garden-heading">{ja ? 'Contributionの流れ' : 'Contribution landscape'}</h2></div><ContributionTooltip day={selected} /></div><p className="grid-instruction">{ja ? '密度が高いほど、庭が深く育ちます。日付と件数は区画を選んで確認できます。' : 'Denser activity grows a deeper garden. Select a day to check its date and count.'}</p><label className="garden-day-picker">{ja ? '日付を選ぶ' : 'Choose a day'}<input type="range" min="0" max={Math.max(0, days.length - 1)} value={selectedIndex} onChange={(event) => setSelected(days[Number(event.target.value)] ?? null)} /></label><div className="garden-canvas" role="img" aria-label={ja ? 'Contributionの年間密度' : 'Annual contribution density'}>{Array.from({ length: leadingBlanks }, (_, index) => <span className="garden-blank" aria-hidden="true" key={`blank-${index}`} />)}{days.map((day) => <GardenPlot key={day.date} day={day} selected={selected?.date === day.date} onSelect={setSelected} />)}</div><div className="garden-legend" aria-label={ja ? '庭の凡例' : 'Garden key'}>{[['soil', '·'], ['sprout', '⌁'], ['grass', '♧'], ['flower', '✿'], ['bush', '♣'], ['tree', '♠']].map(([plant, mark], index) => <span key={plant}><i className={`plant-${plant}`}>{mark}</i>{labels[index]}</span>)}</div></section>;
}
