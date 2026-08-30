export type ContributionLevel =
  | 'NONE'
  | 'FIRST_QUARTILE'
  | 'SECOND_QUARTILE'
  | 'THIRD_QUARTILE'
  | 'FOURTH_QUARTILE';

export type ContributionDay = {
  date: string;
  count: number;
  level: ContributionLevel;
  color: string;
  weekday: number;
};

export type CommitGardenResponse = {
  user: { login: string; name: string | null; avatarUrl: string; url: string };
  range: { from: string; to: string; days: number };
  calendar: { totalContributions: number; days: ContributionDay[] };
  stats: {
    currentStreak: number;
    longestStreak: number;
    averagePerDay: number;
    mostContributionDay: { date: string; count: number } | null;
    mostActiveWeekday: { weekday: number; label: string; total: number } | null;
    dryDays: number;
  };
};

export type ApiErrorCode =
  | 'INVALID_USERNAME'
  | 'NOT_FOUND'
  | 'TOKEN_MISSING'
  | 'TOKEN_INVALID'
  | 'RATE_LIMITED'
  | 'API_NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'NETWORK_ERROR'
  | 'UPSTREAM_ERROR';

export type ApiError = { error: { code: ApiErrorCode; message: string; retryable: boolean } };
