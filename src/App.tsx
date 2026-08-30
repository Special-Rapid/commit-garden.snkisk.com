import { useCallback, useEffect, useRef, useState } from 'react';
import { AppearanceControls } from './components/AppearanceControls';
import { ErrorState } from './components/ErrorState';
import { EmptyState } from './components/EmptyState';
import { GardenGrid } from './components/GardenGrid';
import { LoadingState } from './components/LoadingState';
import { MiniContributionMap } from './components/MiniContributionMap';
import { StatsGrid } from './components/StatsGrid';
import { UsernameSearch } from './components/UsernameSearch';
import { createDemoData } from './lib/fixture';
import { decodeUsernamePathSegment } from './lib/dates';
import type { ApiError, CommitGardenResponse } from './lib/types';
import { PreferencesContext, type Locale, type Theme, type ThemePreference, readStoredPreference, savePreference, text, usePreferences } from './lib/preferences';

function navigate(path: string) { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); }
function Header({ locale }: { locale: Locale }) { return <header className="site-header"><a className="brand" href="/" onClick={(event) => { event.preventDefault(); navigate('/'); }}><span aria-hidden="true">✦</span> Commit Garden</a><span className="header-note">{text(locale, 'A landscape for your developer habit', '開発習慣を風景にする')}</span><AppearanceControls /></header>; }
function Landing({ locale }: { locale: Locale }) { const demo = createDemoData(); return <main className="landing"><section className="hero"><p className="eyebrow">{text(locale, 'A gentler contribution view', 'やさしいContribution表示')}</p><h1>{text(locale, 'Turn your GitHub contributions into a living garden.', 'GitHubのContributionを、育つ庭に。')}</h1><p className="hero-copy">{text(locale, 'Every commit leaves a trace: dry earth, fresh shoots, bright flowers, and trees that mark a brilliant day.', 'commitの一つひとつが、乾いた土、芽、花、そして特別な日の木として残ります。')}</p><UsernameSearch locale={locale} onSubmit={(username) => navigate(`/u/${encodeURIComponent(username)}`)} /><p className="privacy-note">{text(locale, 'We fetch public activity only. Your GitHub token stays on the server.', '公開Contributionだけを取得します。GitHub tokenはサーバーから出ません。')}</p></section><section className="preview" aria-labelledby="preview-heading"><div><p className="eyebrow">{text(locale, 'A small preview', 'プレビュー')}</p><h2 id="preview-heading">{text(locale, 'A year can look alive.', '1年は、ちゃんと育つ。')}</h2></div><div className="preview-garden"><MiniContributionMap days={demo.calendar.days} /><div className="preview-stat"><span>{text(locale, 'Current streak', '現在の連続日数')}</span><strong>{demo.stats.currentStreak} {text(locale, 'days', '日')}</strong></div></div></section></main> }
function Dashboard({ username }: { username: string }) {
  const { locale } = usePreferences();
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
  return <main className="page-shell dashboard">{data.calendar.totalContributions === 0 && <EmptyState />}<StatsGrid calendar={data.calendar} stats={data.stats} /><GardenGrid days={data.calendar.days} /><ShareButton locale={locale} /></main>;
}
function ShareButton({ locale }: { locale: Locale }) { const [message, setMessage] = useState<'copied' | 'fallback' | null>(null); async function copy() { try { await navigator.clipboard.writeText(window.location.href); setMessage('copied'); } catch { setMessage('fallback'); } } const messageText = message === 'copied' ? text(locale, 'Garden link copied.', '庭のリンクをコピーしました。') : message === 'fallback' ? text(locale, 'Copy this URL from your browser address bar.', 'ブラウザのアドレス欄からURLをコピーしてください。') : ''; return <section className="share-row"><div><h2>{text(locale, 'Keep this garden close', 'この庭を残しておこう')}</h2><p>{text(locale, 'Share a link to this public contribution landscape.', '公開Contributionの庭をリンクで共有できます。')}</p></div><div><button type="button" onClick={copy}>{text(locale, 'Copy link', 'リンクをコピー')}</button><span aria-live="polite">{messageText}</span></div></section> }
function InvalidUsernameDashboard() { return <main className="page-shell"><ErrorState error={{ code: 'INVALID_USERNAME', message: 'Enter a valid GitHub username.', retryable: false }} onRetry={() => undefined} /></main>; }
function initialLocale(): Locale { const saved = readStoredPreference('locale'); return saved === 'ja' || saved === 'en' ? saved : (navigator.language.startsWith('ja') ? 'ja' : 'en'); }
function initialThemePreference(): ThemePreference { const saved = readStoredPreference('theme'); return saved === 'dark' || saved === 'light' || saved === 'system' ? saved : 'system'; }
function systemTheme(): Theme { return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
export default function App() { const [path, setPath] = useState(window.location.pathname); const [locale, setLocale] = useState<Locale>(initialLocale); const [themePreference, setThemePreference] = useState<ThemePreference>(initialThemePreference); const [systemPreference, setSystemPreference] = useState<Theme>(systemTheme); const theme = themePreference === 'system' ? systemPreference : themePreference; useEffect(() => { const query = matchMedia('(prefers-color-scheme: dark)'); const update = () => setSystemPreference(query.matches ? 'dark' : 'light'); query.addEventListener('change', update); return () => query.removeEventListener('change', update); }, []); useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.lang = locale; savePreference('theme', themePreference); savePreference('locale', locale); }, [theme, themePreference, locale]); useEffect(() => { const listener = () => setPath(window.location.pathname); window.addEventListener('popstate', listener); return () => window.removeEventListener('popstate', listener); }, []); const match = path.match(/^\/u\/([^/]+)$/); const username = match ? decodeUsernamePathSegment(match[1]) : null; return <PreferencesContext.Provider value={{ locale, setLocale, theme, themePreference, setThemePreference }}><Header locale={locale} />{match ? username === null ? <InvalidUsernameDashboard /> : <Dashboard username={username} /> : <Landing locale={locale} />}</PreferencesContext.Provider>; }
