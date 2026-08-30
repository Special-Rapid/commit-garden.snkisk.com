import { calculateAveragePerDay, calculateCurrentStreak, calculateDryDays, calculateLongestStreak, calculateMostActiveWeekday, calculateMostContributionDay, flattenContributionWeeks } from '../src/lib/stats.ts';
import { isValidGitHubUsername } from '../src/lib/dates.ts';
import type { ApiError, CommitGardenResponse, ContributionDay, ContributionLevel } from '../src/lib/types.ts';

const cache = new Map<string, { expiresAt: number; data: CommitGardenResponse }>();
const endpoint = 'https://api.github.com/graphql';
const query = `query CommitGarden($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) { login name avatarUrl(size: 128) url contributionsCollection(from: $from, to: $to) {
    contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel color weekday } } }
  }} rateLimit { remaining resetAt }
}`;

type GraphQLResponse = { data?: { user: { login: string; name: string | null; avatarUrl: string; url: string; contributionsCollection: { contributionCalendar: { totalContributions: number; weeks: Array<{ contributionDays: Array<{ date: string; contributionCount: number; contributionLevel: ContributionLevel; color: string; weekday: number }> }> } } } | null; rateLimit?: { remaining: number } }; errors?: Array<{ type?: string; message: string }> };

export class GitHubApiError extends Error {
  constructor(public readonly code: ApiError['error']['code'], message: string, public readonly retryable: boolean) { super(message); }
}

function period(days: number) {
  const to = new Date();
  to.setUTCHours(23, 59, 59, 999);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (days - 1));
  from.setUTCHours(0, 0, 0, 0);
  return { from, to };
}

export async function getCommitGardenData(username: string, token: string | undefined, range = 365): Promise<CommitGardenResponse> {
  const login = username.trim();
  if (!isValidGitHubUsername(login)) throw new GitHubApiError('INVALID_USERNAME', 'Enter a valid GitHub username.', false);
  if (!token) throw new GitHubApiError('TOKEN_MISSING', 'The server is missing its GitHub API token.', false);
  const safeRange = Number.isInteger(range) ? Math.min(Math.max(range, 1), 365) : 365;
  const { from, to } = period(safeRange);
  const key = `${login.toLowerCase()}:${from.toISOString().slice(0, 10)}:${to.toISOString().slice(0, 10)}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  let response: Response;
  try {
    response = await fetch(endpoint, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ query, variables: { login, from: from.toISOString(), to: to.toISOString() } }) });
  } catch {
    throw new GitHubApiError('NETWORK_ERROR', 'Could not reach GitHub. Please try again.', true);
  }
  let payload: GraphQLResponse;
  try { payload = await response.json() as GraphQLResponse; } catch { throw new GitHubApiError('UPSTREAM_ERROR', 'GitHub returned an unreadable response.', true); }
  if (response.status === 401) throw new GitHubApiError('TOKEN_INVALID', 'The server GitHub API token is invalid or expired.', false);
  const hasReadUserScope = (response.headers.get('x-oauth-scopes') ?? '').split(',').map((scope) => scope.trim()).includes('read:user');
  if (hasReadUserScope) throw new GitHubApiError('TOKEN_INVALID', 'The server GitHub token has read:user scope, which is not allowed for public-only data.', false);
  const isRateLimited = response.headers.get('x-ratelimit-remaining') === '0' || payload.data?.rateLimit?.remaining === 0 || payload.errors?.some((error) => /rate limit/i.test(error.message));
  if (isRateLimited) throw new GitHubApiError('RATE_LIMITED', 'GitHub API rate limit reached. Please try again later.', true);
  if (response.status === 403) throw new GitHubApiError('UPSTREAM_ERROR', 'GitHub rejected this request. Please try again later.', true);
  if (!response.ok) throw new GitHubApiError('UPSTREAM_ERROR', 'GitHub could not process this request.', true);
  if (payload.errors?.length) throw new GitHubApiError('UPSTREAM_ERROR', 'GitHub could not complete this request. Please try again.', true);
  if (!payload.data?.user) throw new GitHubApiError('NOT_FOUND', `GitHub user “${login}” was not found.`, false);
  const calendar = payload.data.user.contributionsCollection.contributionCalendar;
  const days = flattenContributionWeeks(calendar.weeks.map((week) => ({ contributionDays: week.contributionDays.map((day): ContributionDay => ({ date: day.date, count: day.contributionCount, level: day.contributionLevel, color: day.color, weekday: day.weekday })) })));
  const weekdaySample = days[0];
  if (weekdaySample) console.info('[commit-garden] GitHub weekday sample', { date: weekdaySample.date, weekday: weekdaySample.weekday });
  const data: CommitGardenResponse = {
    user: { login: payload.data.user.login, name: payload.data.user.name, avatarUrl: payload.data.user.avatarUrl, url: payload.data.user.url },
    range: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10), days: days.length },
    calendar: { totalContributions: calendar.totalContributions, days },
    stats: { currentStreak: calculateCurrentStreak(days), longestStreak: calculateLongestStreak(days), averagePerDay: calculateAveragePerDay(calendar.totalContributions, days), mostContributionDay: calculateMostContributionDay(days), mostActiveWeekday: calculateMostActiveWeekday(days), dryDays: calculateDryDays(days) },
  };
  cache.set(key, { data, expiresAt: Date.now() + 60 * 60 * 1000 });
  return data;
}

export function errorPayload(error: unknown): { status: number; body: ApiError } {
  if (error instanceof URIError) return { status: 400, body: { error: { code: 'INVALID_USERNAME', message: 'Enter a valid GitHub username.', retryable: false } } };
  if (error instanceof GitHubApiError) {
    const status = error.code === 'INVALID_USERNAME' ? 400 : error.code === 'NOT_FOUND' || error.code === 'API_NOT_FOUND' ? 404 : error.code === 'METHOD_NOT_ALLOWED' ? 405 : error.code === 'TOKEN_MISSING' || error.code === 'TOKEN_INVALID' ? 503 : error.code === 'RATE_LIMITED' ? 429 : 502;
    return { status, body: { error: { code: error.code, message: error.message, retryable: error.retryable } } };
  }
  return { status: 500, body: { error: { code: 'UPSTREAM_ERROR', message: 'Something unexpected happened. Please try again.', retryable: true } } };
}
