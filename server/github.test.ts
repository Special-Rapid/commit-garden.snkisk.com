import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorPayload, getCommitGardenData, GitHubApiError } from './github.ts';

afterEach(() => vi.unstubAllGlobals());

describe('GitHub API errors', () => {
  it('keeps an invalid token distinct from a retryable rate limit', () => {
    expect(errorPayload(new GitHubApiError('TOKEN_INVALID', 'invalid token', false))).toEqual({ status: 503, body: { error: { code: 'TOKEN_INVALID', message: 'invalid token', retryable: false } } });
    expect(errorPayload(new GitHubApiError('RATE_LIMITED', 'rate limited', true))).toEqual({ status: 429, body: { error: { code: 'RATE_LIMITED', message: 'rate limited', retryable: true } } });
  });

  it('normalizes malformed URL encoding as an invalid username', () => {
    expect(errorPayload(new URIError('URI malformed'))).toEqual({ status: 400, body: { error: { code: 'INVALID_USERNAME', message: 'Enter a valid GitHub username.', retryable: false } } });
  });

  it('does not confuse a GraphQL upstream error with a missing user', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { user: null }, errors: [{ message: 'Internal error' }] }), { status: 200 })));
    await expect(getCommitGardenData('graphql-error-fixture', 'token')).rejects.toMatchObject({ code: 'UPSTREAM_ERROR', retryable: true });
  });

  it('identifies the service to GitHub GraphQL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { user: null }, errors: [{ message: 'Internal error' }] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(getCommitGardenData('user-agent-fixture', 'token')).rejects.toMatchObject({ code: 'UPSTREAM_ERROR', retryable: true });
    expect(fetchMock).toHaveBeenCalledWith('https://api.github.com/graphql', expect.objectContaining({ headers: expect.objectContaining({ 'user-agent': 'commit-garden.snkisk.com' }) }));
  });
});
