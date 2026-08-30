# Commit Garden 🌱

GitHubの公開Contributionを、乾いた土・芽・草・花・低木・木が育つ庭として眺める小さなWebアプリです。

## できること

- GitHub usernameから過去365日の公開Contributionを取得
- Total Contributions / current・longest streak / average / peak day / active weekday / dry daysを表示
- 件数に応じて庭のプロットを変化させ、hover・tap・キーボードで日付と件数を確認
- ミニContribution mapと共有URLコピー
- 無効username、未設定token、rate limit、GitHub未到達、該当ユーザーなし、寄与ゼロを明確に表示

## ローカル起動

必要環境: Node.js 20以降。

```bash
npm install
cp .env.example .env
# .envのGITHUB_TOKENにGitHub tokenをローカルで設定する
npm run dev
```

`GITHUB_TOKEN` はViteの開発middlewareとCloudflare Workerだけで利用します。**`read:user` scopeを付けない最小権限token**を使ってください。`read:user`が付くtokenはprivate/internal contributionを含み得るため、このアプリはserver側で拒否します。`VITE_` prefixを付けず、ブラウザへ公開しないでください。

```bash
npm test
npm run typecheck
npm run build
```

## Cloudflare Workers Builds への接続

このリポジトリはCloudflare Workers Static Assets構成です。

- `wrangler.jsonc`: Worker名、`src/worker.ts`、`dist/`の静的配信、SPA fallback、`/api/*`のWorker先行を定義
- `src/worker.ts`: `GET /api/github/:username` のみを処理し、その他はCloudflareのasset bindingへ渡す
- build command: `npm ci && npm run build`

GitHubへpush後、Cloudflare Dashboardの **Workers & Pages** からWorkerを作成してGitHub repository `commit-garden.snkisk.com` を接続してください。既存Workerに紐付ける場合は **Settings → Builds → Git Repository** から管理できます。接続後、Workerの **Settings → Variables and Secrets** で `GITHUB_TOKEN` を**secret**として登録してください。値をGitHub、`wrangler.jsonc`、またはfrontend環境変数に置かないでください。

ローカルでWorkers設定を確認する場合:

```bash
npx wrangler deploy --dry-run
```

## 仕組み

GitHub GraphQL APIの`contributionsCollection(from, to)`をサーバー側から呼び、`weeks[].contributionDays[]`を日付順に正規化します。同じ`username + from + to`は実行中プロセス内で1時間キャッシュします。

| Contribution count | Garden plot |
| --- | --- |
| 0 | Dry soil |
| 1–2 | Sprout |
| 3–5 | Grass |
| 6–10 | Flower |
| 11–20 | Bush |
| 21+ | Tree |

## MVPの境界

公開Contributionのみを扱います。OAuth、private contribution、DB、アカウント、ランキング、README SVG生成、OG画像は未実装です。`/u/:username.svg` と `/api/svg/:username` は将来拡張のために通常のAPI/UI境界から独立しています。
