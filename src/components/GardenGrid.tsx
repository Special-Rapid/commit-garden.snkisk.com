import { useState } from 'react';
import type { ContributionDay } from '../lib/types';
import { ContributionTooltip } from './ContributionTooltip';
import { GardenPlot } from './GardenPlot';

export function GardenGrid({ days }: { days: ContributionDay[] }) {
  const [selected, setSelected] = useState<ContributionDay | null>(days.at(-1) ?? null);
  const leadingBlanks = days[0]?.weekday ?? 0;
  return <section className="garden-section" aria-labelledby="garden-heading"><div className="section-heading"><div><p className="eyebrow">365-day landscape</p><h2 id="garden-heading">Your commit garden</h2></div><ContributionTooltip day={selected} /></div><p className="grid-instruction">Each plot is one day. Scroll horizontally or use Tab to explore every date.</p><div className="garden-scroll"><div className="garden-grid" role="group" aria-label="Contribution garden"><div className="weekday-labels" aria-hidden="true"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div><div className="garden-plots">{Array.from({ length: leadingBlanks }, (_, index) => <span className="garden-blank" aria-hidden="true" key={`blank-${index}`} />)}{days.map((day) => <GardenPlot key={day.date} day={day} selected={selected?.date === day.date} onSelect={setSelected} />)}</div></div></div><div className="garden-legend" aria-label="Garden key"><span><i className="plant-soil">·</i> Dry soil</span><span><i className="plant-sprout">⌁</i> Sprout</span><span><i className="plant-grass">♧</i> Grass</span><span><i className="plant-flower">✿</i> Flower</span><span><i className="plant-bush">♣</i> Bush</span><span><i className="plant-tree">♠</i> Tree</span></div></section>;
}
