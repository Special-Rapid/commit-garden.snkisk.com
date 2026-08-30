import { useState } from 'react';
import type { ContributionDay } from '../lib/types';
import { ContributionTooltip } from './ContributionTooltip';
import { GardenPlot } from './GardenPlot';
import { usePreferences } from '../lib/preferences';

export function GardenGrid({ days }: { days: ContributionDay[] }) {
  const { locale } = usePreferences();
  const ja = locale === 'ja';
  const [selected, setSelected] = useState<ContributionDay | null>(days.at(-1) ?? null);
  const leadingBlanks = days[0]?.weekday ?? 0;
  const weekdays = ja ? ['日', '月', '火', '水', '木', '金', '土'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const labels = ja ? ['乾いた土', '芽', '草', '花', '低木', '木'] : ['Dry soil', 'Sprout', 'Grass', 'Flower', 'Bush', 'Tree'];
  return <section className="garden-section" aria-labelledby="garden-heading"><div className="section-heading"><div><p className="eyebrow">{ja ? '365日間の風景' : '365-day landscape'}</p><h2 id="garden-heading">{ja ? 'あなたのCommit Garden' : 'Your commit garden'}</h2></div><ContributionTooltip day={selected} /></div><p className="grid-instruction">{ja ? 'ひとつの区画は1日です。横にスクロールするか、Tabで日付をたどれます。' : 'Each plot is one day. Scroll horizontally or use Tab to explore every date.'}</p><div className="garden-scroll"><div className="garden-grid" role="group" aria-label={ja ? 'Contributionの庭' : 'Contribution garden'}><div className="weekday-labels" aria-hidden="true">{weekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}</div><div className="garden-plots">{Array.from({ length: leadingBlanks }, (_, index) => <span className="garden-blank" aria-hidden="true" key={`blank-${index}`} />)}{days.map((day) => <GardenPlot key={day.date} day={day} selected={selected?.date === day.date} onSelect={setSelected} />)}</div></div></div><div className="garden-legend" aria-label={ja ? '庭の凡例' : 'Garden key'}>{[['soil', '·'], ['sprout', '⌁'], ['grass', '♧'], ['flower', '✿'], ['bush', '♣'], ['tree', '♠']].map(([plant, mark], index) => <span key={plant}><i className={`plant-${plant}`}>{mark}</i>{labels[index]}</span>)}</div></section>;
}
