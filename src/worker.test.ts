import { describe, expect, it } from 'vitest';
import worker from './worker';

describe('static page routing', () => {
  const requests: string[] = [];
  const env = { ASSETS: { fetch: async (request: Request) => {
    const path = new URL(request.url).pathname;
    requests.push(path);
    return new Response(path === '/' ? '<h1>Commit Garden</h1>' : null, { status: path === '/' ? 200 : 404 });
  } } };

  it.each(['GET', 'HEAD'])('preserves the dashboard shell for %s without querying GitHub', async method => {
    requests.length = 0;
    const response = await worker.fetch(new Request('https://commit-garden.snkisk.com/u/example', { method }), env);
    expect(response.status).toBe(200);
    expect(requests).toEqual(['/']);
  });

  it.each(['/missing.txt', '/llms-missing.txt', '/u/example/extra', '/u/'])('does not turn %s into a successful app page', async path => {
    const response = await worker.fetch(new Request(`https://commit-garden.snkisk.com${path}`), env);
    expect(response.status).toBe(404);
  });

  it('retains API error responses without falling back to HTML', async () => {
    const response = await worker.fetch(new Request('https://commit-garden.snkisk.com/api/unknown'), env);
    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toMatchObject({ error: { code: 'API_NOT_FOUND' } });
  });
});
