import { FormEvent, useId, useState } from 'react';
import { isValidGitHubUsername } from '../lib/dates';
import type { Locale } from '../lib/preferences';

type Props = { initialValue?: string; onSubmit: (username: string) => void; pending?: boolean; locale: Locale };

export function UsernameSearch({ initialValue = '', onSubmit, pending = false, locale }: Props) {
  const [username, setUsername] = useState(initialValue);
  const [hasValidationError, setHasValidationError] = useState(false);
  const id = useId();
  function submit(event: FormEvent) {
    event.preventDefault();
    const value = username.trim();
    if (!isValidGitHubUsername(value)) { setHasValidationError(true); return; }
    setHasValidationError(false); onSubmit(value);
  }
  const help = hasValidationError ? (locale === 'ja' ? '1〜39文字の英数字かハイフンを入力してください。先頭・末尾のハイフンは使えません。' : 'Use 1–39 letters, numbers, or hyphens. A hyphen cannot start or end the name.') : (locale === 'ja' ? '公開Contributionのみ。ログインは不要です。' : 'Public GitHub contributions only. No sign-in needed.');
  return <form className="username-search" onSubmit={submit} noValidate>
    <label htmlFor={id}>GitHub username</label>
    <div className="search-row">
      <input id={id} autoComplete="username" inputMode="text" spellCheck="false" placeholder="e.g. octocat" value={username} onChange={(event) => setUsername(event.target.value)} aria-describedby={hasValidationError ? `${id}-error` : undefined} aria-invalid={hasValidationError} disabled={pending} />
      <button type="submit" disabled={pending}>{pending ? (locale === 'ja' ? '庭を育てています…' : 'Growing garden…') : (locale === 'ja' ? '庭をつくる' : 'Generate garden')}</button>
    </div>
    <p className="field-help" id={hasValidationError ? `${id}-error` : undefined} role={hasValidationError ? 'alert' : undefined}>{help}</p>
  </form>;
}
