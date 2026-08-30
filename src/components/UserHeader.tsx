import type { CommitGardenResponse } from '../lib/types';
import { usePreferences } from '../lib/preferences';

export function UserHeader({ user, range }: Pick<CommitGardenResponse, 'user' | 'range'>) {
  const { locale } = usePreferences();
  const ja = locale === 'ja';
  return <header className="user-header">
    <img className="avatar" src={user.avatarUrl} width="72" height="72" alt={ja ? `${user.login} のGitHubアバター` : `${user.login}'s GitHub avatar`} />
    <div><p className="eyebrow">{ja ? 'この庭の持ち主' : 'Garden owner'}</p><h1>{user.name || user.login}</h1><a href={user.url} target="_blank" rel="noreferrer">@{user.login} {ja ? 'のGitHub' : 'on GitHub'} <span aria-hidden="true">↗</span></a></div>
    <p className="range-copy">{ja ? '公開活動の1年分' : 'One year of public activity'}<br />{range.days}{ja ? '日間を観測' : ' days observed'}</p>
  </header>;
}
