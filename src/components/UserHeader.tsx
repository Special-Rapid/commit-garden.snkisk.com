import type { CommitGardenResponse } from '../lib/types';

export function UserHeader({ user, range }: Pick<CommitGardenResponse, 'user' | 'range'>) {
  return <header className="user-header">
    <img className="avatar" src={user.avatarUrl} width="72" height="72" alt={`${user.login}'s GitHub avatar`} />
    <div><p className="eyebrow">Garden owner</p><h1>{user.name || user.login}</h1><a href={user.url} target="_blank" rel="noreferrer">@{user.login} on GitHub <span aria-hidden="true">↗</span></a></div>
    <p className="range-copy">One year of public activity<br />{range.days} days observed</p>
  </header>;
}
