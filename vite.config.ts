import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createGitHubApiMiddleware } from './server/vite-api.ts';

export default defineConfig(({ mode }) => {
  const serverEnv = loadEnv(mode, process.cwd(), '');
  return { plugins: [react(), createGitHubApiMiddleware(serverEnv.GITHUB_TOKEN)] };
});
