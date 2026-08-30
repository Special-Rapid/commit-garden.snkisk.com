type Props = { label: string; value: string | number; detail: string; tone?: 'leaf' | 'flower' | 'soil' };
export function StatCard({ label, value, detail, tone = 'leaf' }: Props) { return <article className={`stat-card tone-${tone}`}><p>{label}</p><strong>{value}</strong><span>{detail}</span></article>; }
