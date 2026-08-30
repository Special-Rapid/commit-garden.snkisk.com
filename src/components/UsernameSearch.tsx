import { FormEvent, useId, useState } from 'react';
import { isValidGitHubUsername } from '../lib/dates';

type Props = { initialValue?: string; onSubmit: (username: string) => void; pending?: boolean };

export function UsernameSearch({ initialValue = '', onSubmit, pending = false }: Props) {
  const [username, setUsername] = useState(initialValue);
  const [error, setError] = useState('');
  const id = useId();
  function submit(event: FormEvent) {
    event.preventDefault();
    const value = username.trim();
    if (!isValidGitHubUsername(value)) { setError('Use 1–39 letters, numbers, or hyphens. A hyphen cannot start or end the name.'); return; }
    setError(''); onSubmit(value);
  }
  return <form className="username-search" onSubmit={submit} noValidate>
    <label htmlFor={id}>GitHub username</label>
    <div className="search-row">
      <input id={id} autoComplete="username" inputMode="text" spellCheck="false" placeholder="e.g. octocat" value={username} onChange={(event) => setUsername(event.target.value)} aria-describedby={error ? `${id}-error` : undefined} aria-invalid={Boolean(error)} disabled={pending} />
      <button type="submit" disabled={pending}>{pending ? 'Growing garden…' : 'Generate garden'}</button>
    </div>
    <p className="field-help" id={error ? `${id}-error` : undefined} role={error ? 'alert' : undefined}>{error || 'Public GitHub contributions only. No sign-in needed.'}</p>
  </form>;
}
