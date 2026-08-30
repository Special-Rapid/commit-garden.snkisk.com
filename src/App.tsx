import { useCallback, useEffect, useRef, useState } from 'react';
import { ErrorState } from './components/ErrorState';
import { EmptyState } from './components/EmptyState';
import { GardenGrid } from './components/GardenGrid';
import { LoadingState } from './components/LoadingState';
import { MiniContributionMap } from './components/MiniContributionMap';
import { StatsGrid } from './components/StatsGrid';
import { UserHeader } from './components/UserHeader';
import { UsernameSearch } from './components/UsernameSearch';
import { createDemoData } from './lib/fixture';
import { decodeUsernamePathSegment } from './lib/dates';
import type { ApiError, CommitGardenResponse } from './lib/types';

function navigate(path: string) { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); }
function Header() { return <header className="site-header"><a className="brand" href="/" onClick={(event) => { event.preventDefault(); navigate('/'); }}><span aria-hidden="true">✦</span> Commit Garden</a><span className="header-note">A landscape for your developer habit</span></header>; }
function Landing() { const demo = createDemoData(); return <><main className="landing"><section className="hero"><p className="eyebrow">A gentler contribution view</p><h1>Turn your GitHub contributions into a living garden.</h1><p className="hero-copy">Every commit leaves a trace: dry earth, fresh shoots, bright flowers, and trees that mark a brilliant day.</p><UsernameSearch onSubmit={(username) => navigate(`/u/${encodeURIComponent(username)}`)} /><p className="privacy-note">We fetch public activity only. Your GitHub token stays on the server.</p></section><section className="preview" aria-labelledby="preview-heading"><div><p className="eyebrow">A small preview</p><h2 id="preview-heading">A year can look alive.</h2><p>Explore the rhythm behind a contribution graph: the quiet days, the restarts, and the runs that grew into something bigger.</p></div><div className="preview-garden"><MiniContributionMap days={demo.calendar.days} /><div className="preview-stat"><span>Current streak</span><strong>{demo.stats.currentStreak} days</strong></div></div></section></main></> }
function Dashboard({ username }: { username: string }) {
  const [state, setState] = useState<{ data?: CommitGardenResponse; error?: ApiError['error']; loading: boolean }>({ loading: true });
  const requestController = useRef<AbortController | null>(null);
  const requestVersion = useRef(0);
  const load = useCallback(() => {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    const version = ++requestVersion.current;
    setState({ loading: true });
    fetch(`/api/github/${encodeURIComponent(username)}?range=365`, { signal: controller.signal }).then(async (response) => {
      const body = await response.json() as CommitGardenResponse | ApiError;
      if (!response.ok) throw body;
      if (!controller.signal.aborted && requestVersion.current === version) setState({ data: body as CommitGardenResponse, loading: false });
    }).catch((reason: ApiError | { error?: ApiError['error'] } | DOMException) => {
      if (controller.signal.aborted || requestVersion.current !== version) return;
      setState({ error: 'error' in reason && reason.error ? reason.error : { code: 'UPSTREAM_ERROR', message: 'Something unexpected happened. Please try again.', retryable: true }, loading: false });
    });
  }, [username]);
  useEffect(() => { load(); return () => requestController.current?.abort(); }, [load]);
  if (state.loading) return <main className="page-shell"><LoadingState /></main>;
  if (state.error) return <main className="page-shell"><ErrorState error={state.error} onRetry={load} /></main>;
  const data = state.data!;
  return <main className="page-shell dashboard"><UserHeader user={data.user} range={data.range} />{data.calendar.totalContributions === 0 && <EmptyState />}<StatsGrid calendar={data.calendar} stats={data.stats} /><GardenGrid days={data.calendar.days} /><MiniContributionMap days={data.calendar.days} /><ShareButton /></main>;
}
function ShareButton() { const [message, setMessage] = useState(''); async function copy() { try { await navigator.clipboard.writeText(window.location.href); setMessage('Garden link copied.'); } catch { setMessage('Copy this URL from your browser address bar.'); } } return <section className="share-row"><div><h2>Keep this garden close</h2><p>Share a link to this public contribution landscape.</p></div><div><button type="button" onClick={copy}>Copy link</button><span aria-live="polite">{message}</span></div></section> }
function InvalidUsernameDashboard() { return <main className="page-shell"><ErrorState error={{ code: 'INVALID_USERNAME', message: 'Enter a valid GitHub username.', retryable: false }} onRetry={() => undefined} /></main>; }
export default function App() { const [path, setPath] = useState(window.location.pathname); useEffect(() => { const listener = () => setPath(window.location.pathname); window.addEventListener('popstate', listener); return () => window.removeEventListener('popstate', listener); }, []); const match = path.match(/^\/u\/([^/]+)$/); const username = match ? decodeUsernamePathSegment(match[1]) : null; return <><Header />{match ? username === null ? <InvalidUsernameDashboard /> : <Dashboard username={username} /> : <Landing />}</>; }
