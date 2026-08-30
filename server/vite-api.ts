import type { Plugin } from 'vite';
import { errorPayload, getCommitGardenData } from './github.ts';

export function createGitHubApiMiddleware(token: string | undefined): Plugin {
  return { name: 'commit-garden-api', configureServer(server) {
    server.middlewares.use('/api', async (request, response) => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const match = url.pathname.match(/^\/github\/([^/]+)$/);
      if (!match || request.method !== 'GET') {
        const code = request.method === 'GET' ? 'API_NOT_FOUND' : 'METHOD_NOT_ALLOWED';
        response.statusCode = request.method === 'GET' ? 404 : 405;
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ error: { code, message: code === 'API_NOT_FOUND' ? 'API route not found.' : 'Method not allowed.', retryable: false } }));
        return;
      }
      try {
        const data = await getCommitGardenData(decodeURIComponent(match[1]), token, Number(url.searchParams.get('range') ?? 365));
        response.setHeader('content-type', 'application/json'); response.end(JSON.stringify(data));
      } catch (error) {
        const result = errorPayload(error); response.statusCode = result.status; response.setHeader('content-type', 'application/json'); response.end(JSON.stringify(result.body));
      }
    });
  }};
}
