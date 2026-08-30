export const weekdayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

export function isValidGitHubUsername(username: string): boolean {
  return /^(?!-)[a-zA-Z0-9-]{1,39}(?<!-)$/.test(username);
}

export function decodeUsernamePathSegment(segment: string): string | null {
  try { return decodeURIComponent(segment); } catch { return null; }
}
