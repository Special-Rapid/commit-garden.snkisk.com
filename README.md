[日本語](README-ja.md)

# Commit Garden 🌱

**Turn public GitHub contributions into a living garden.**

[Commit Garden](https://commit-garden.snkisk.com/) visualizes the past 365 days of public GitHub contributions as a landscape of dry soil, grass, flowers, bushes, and trees. Instead of copying the contribution graph, it offers a way to look back on development habits through a single landscape.

**Public access is temporarily paused.** The features below describe the application available for local development. Production is configured to serve the suspension page described below. Renewal and media work remain deferred.

## Features

- Fetch the past 365 days of public contributions by GitHub username.
- Show total contributions, current and longest streaks, average per day, most active weekday, and dry days.
- Render a continuous Canvas garden of dry soil, cracks, grass, flowers, bushes, and trees from each day's contribution count and position.
- Select a day with a keyboard, click, or tap to inspect its date and contribution count.
- Switch and persist System / Light / Dark themes and Japanese / English.
- Copy a share URL and open a minimal link to the GitHub profile.
- Display distinct states for invalid usernames, missing tokens, rate limits, network failures, and empty data. Correct handling of nonexistent users remains tracked in [Issue #3](https://github.com/Special-Rapid/commit-garden.snkisk.com/issues/3).

## Architecture

- React + TypeScript + Vite.
- Cloudflare Workers Static Assets; Cloudflare Pages is not used.
- GitHub GraphQL requests run only on the server side.
- Production uses a Cloudflare secret for `GITHUB_TOKEN`; the token is never included in the browser bundle.
- Garden runtime media is delivered from Cloudflare R2/CDN through immutable URLs, rather than stored in Git.

| Location | Responsibility |
| --- | --- |
| [src/](src/) | React application and Worker entry point |
| [src/worker.ts](src/worker.ts) | Worker and `GET /api/github/:username` route, currently suspended |
| [server/](server/) | GraphQL retrieval, normalization, statistics, and development middleware |
| [src/lib/stats.ts](src/lib/stats.ts) | Pure statistics calculations |
| [src/components/GardenCanvas.tsx](src/components/GardenCanvas.tsx) | Contribution-driven Canvas 2D garden renderer |
| [suspended/](suspended/) | Static production suspension page and headers |

## Local development

Use a maintained, patched Node.js release satisfying Node.js 22.12 or later. Wrangler requires Node.js 22 or later; Vite requires at least 22.12 on that release line. Local verification has used Node.js 24.22.1 with npm 10 and npm 11.

```bash
npm ci
cp .env.example .env
# Set GITHUB_TOKEN locally in .env.
npm run dev
```

The development server listens on `http://127.0.0.1:5173` and uses the application and server-side middleware independently of the production suspension gate.

`GITHUB_TOKEN` is used only by the development middleware and Cloudflare Worker. Never add the `VITE_` prefix or put its value in Git, `wrangler.jsonc`, frontend environment variables, issues, commits, or logs.

```bash
npm test
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

The dry run checks the configured suspended Worker/assets without publishing them. A successful build or dry run does not verify the public service.

## Cloudflare Workers Builds

This repository uses Workers Static Assets.

- Build command: `npm ci && npm run build`
- Deploy command: `npx wrangler deploy`
- Normal publication uses `dist/` as Static Assets. The suspension uses the directory and routing below.

When configuring an authorized production connection, register `GITHUB_TOKEN` as a production secret under **Settings → Variables and Secrets**. Never publish its value. These instructions do not authorize deployment or reopening the service.

## Temporary publication pause

The configured production asset directory is `./suspended`, containing only the suspension page. Normal page requests and SPA fallback are configured to serve the Japanese/English static notice with HTTP 200. The previous application's `dist/` assets, JavaScript, and CSS are not uploaded.

Only `/api/*` runs through the Worker first and returns HTTP 503. Any other request reaching the Worker also returns 503 without calling GitHub or the ASSETS binding. The notice and suspension responses use `no-store` and `noindex`; the notice has no scripts, inputs, or links that run the old application. Normal suspension-page requests keep static delivery instead of Worker invocations. These status codes describe the configured behavior, not a guarantee of current public availability.

Reopening requires separate approval, reversal of the suspension changes, and the normal build/deployment checks. The pre-suspension code is `acdc019af7f4428f5480467690c970dd370b615f`. The original asset directory was `./dist`, `not_found_handling` was `none`, and `run_worker_first` was `["/api/*", "/u/*"]`. Preserve subsequent dependency fixes when preparing any restoration.

Production aliases use the same suspension behavior. Historical version preview URLs and other hosting services require separate verification. The repository, deployment history, secrets, DNS, and R2 media remain in place.

## Contribution mapping

| Count | Garden state |
| --- | --- |
| 0 | Dry soil |
| 1–2 | Sprout |
| 3–5 | Grass |
| 6–10 | Flower |
| 11–20 | Bush |
| 21+ | Tree |

The garden is not a fixed panorama. It is rendered deterministically from daily contribution counts, dry days, and calendar positions, so different contribution data produces a different landscape.

## Scope

The MVP handles public contributions only. OAuth, private contributions, a database, accounts, rankings, README SVG generation, and OG images are not implemented.

## License

[MIT](LICENSE). The existing copyright notice is preserved. Dependencies and external media retain their respective license terms.
