import { errorPayload, getCommitGardenData } from '../server/github';

type Env = { GITHUB_TOKEN?: string; ASSETS: { fetch(request: Request): Promise<Response> } };

// Temporary publication pause. Revert this change when the renewed service is ready.
const PUBLIC_SERVICE_SUSPENDED = true;
const suspensionNotice = [
  'Commit Garden',
  'リニューアル準備のため、公開を一時停止しています。',
  'Temporarily unavailable while we prepare the renewed service.',
  '',
].join('\n');

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (PUBLIC_SERVICE_SUSPENDED) {
      return new Response(request.method === 'HEAD' ? null : suspensionNotice, {
        status: 503,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'no-store',
          'x-robots-tag': 'noindex, nofollow, noarchive',
          'x-content-type-options': 'nosniff',
        },
      });
    }
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/api\/github\/([^/]+)$/);
    if (request.method === 'GET' && match) {
      try {
        const data = await getCommitGardenData(decodeURIComponent(match[1]), env.GITHUB_TOKEN, Number(url.searchParams.get('range') ?? 365));
        return Response.json(data, { headers: { 'cache-control': 'public, max-age=3600' } });
      } catch (error) {
        const result = errorPayload(error);
        return Response.json(result.body, { status: result.status });
      }
    }
    if (url.pathname.startsWith('/api/')) {
      const error = request.method === 'GET'
        ? { code: 'API_NOT_FOUND', message: 'API route not found.', retryable: false }
        : { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.', retryable: false };
      return Response.json({ error }, { status: request.method === 'GET' ? 404 : 405 });
    }
    // Only the existing client-side dashboard route needs the application shell.
    // Missing asset/discovery URLs must retain a real 404 response.
    if ((request.method === 'GET' || request.method === 'HEAD') && /^\/u\/[^/]+$/.test(url.pathname)) {
      return env.ASSETS.fetch(new Request(new URL('/', url), request));
    }
    return env.ASSETS.fetch(request);
  },
};
