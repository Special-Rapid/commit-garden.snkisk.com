import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from './worker';

describe('Worker denial during the temporary publication pause', () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    '/', '/u/example', '/api/github/octocat?range=365', '/api/unknown',
    '/assets/index-mOxgpfdl.js', '/robots.txt', '/sitemap.xml', '/llms.txt',
    '/missing.txt', '/u/example/extra', '/api/github/%E0%A4%A',
  ])('stops %s before static assets or the GitHub upstream', async path => {
    const assets = vi.fn(() => { throw new Error('Assets must remain unavailable'); });
    const upstream = vi.fn(() => { throw new Error('GitHub must not be queried'); });
    vi.stubGlobal('fetch', upstream);
    const response = await worker.fetch(new Request(`https://commit-garden.snkisk.com${path}`), {
      ASSETS: { fetch: assets }, GITHUB_TOKEN: 'test-only-unused-token',
    });
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(response.headers.get('x-robots-tag')).toContain('noindex');
    expect(await response.text()).toContain('公開を一時停止');
    expect(assets).not.toHaveBeenCalled();
    expect(upstream).not.toHaveBeenCalled();
  });

  it.each(['HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'])('also stops %s requests', async method => {
    const assets = vi.fn();
    const response = await worker.fetch(new Request('https://example.workers.dev/api/github/octocat', { method }), {
      ASSETS: { fetch: assets },
    });
    expect(response.status).toBe(503);
    const body = await response.text();
    if (method === 'HEAD') expect(body).toBe('');
    else expect(body).toContain('Temporarily unavailable');
    expect(assets).not.toHaveBeenCalled();
  });
});
