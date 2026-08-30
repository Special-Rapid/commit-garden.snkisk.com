import type { ApiError } from '../lib/types';
import { usePreferences } from '../lib/preferences';

const japaneseMessages: Partial<Record<ApiError['error']['code'], string>> = {
  INVALID_USERNAME: '有効なGitHubユーザー名を入力してください。',
  NOT_FOUND: 'そのGitHubユーザーは見つかりませんでした。',
  TOKEN_MISSING: 'サーバー側のGitHub API tokenがまだ設定されていません。',
  TOKEN_INVALID: 'サーバー側のGitHub API tokenを確認してください。',
  RATE_LIMITED: 'GitHub APIの利用上限に達しました。少し待ってから再試行してください。',
  API_NOT_FOUND: '指定されたAPIの入口が見つかりませんでした。ホームからやり直してください。',
  METHOD_NOT_ALLOWED: 'この操作は利用できません。ホームからやり直してください。',
  NETWORK_ERROR: 'ネットワークに接続できませんでした。接続を確認してから再試行してください。',
  UPSTREAM_ERROR: 'GitHubとの通信で問題が起きました。少し待ってから再試行してください。',
};

export function ErrorState({ error, onRetry }: { error: ApiError['error']; onRetry: () => void }) {
  const { locale } = usePreferences();
  const ja = locale === 'ja';
  const canTryAnother = error.code === 'NOT_FOUND' || error.code === 'INVALID_USERNAME';
  return <section className="state-card error-state" role="alert"><span aria-hidden="true">!</span><h1>{ja ? '庭を開けませんでした' : 'Your garden needs a moment'}</h1><p>{ja ? japaneseMessages[error.code] ?? error.message : error.message}</p>{error.retryable ? <button type="button" onClick={onRetry}>{ja ? 'もう一度試す' : 'Try again'}</button> : <a href="/">{canTryAnother ? (ja ? '別のユーザー名を試す' : 'Try another username') : (ja ? 'ホームへ戻る' : 'Return home')}</a>}</section>;
}
