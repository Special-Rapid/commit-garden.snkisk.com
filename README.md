# Commit Garden 🌱

**Turn public GitHub contributions into a living garden.**

[commit-garden.snkisk.com](https://commit-garden.snkisk.com/) は、過去365日のGitHub公開Contributionを、乾いた土から草花・低木・木へつながる庭として描くWebアプリです。GitHubの草グラフを複製するのではなく、開発習慣をひとつの風景として振り返れるようにします。

## Features

- GitHub usernameから過去365日の公開Contributionを取得
- total contributions、current/longest streak、average/day、most active weekday、dry daysを表示
- 日別の件数と位置をもとに、乾いた土・ひび・草・花・低木・木が連続して育つCanvas庭園を描画
- キーボード、クリック、タップで任意の日を選び、日付とContribution件数を確認
- System / Light / Dark theme と日本語 / English を切替・保存
- 共有URLのコピーとGitHubプロフィールへの最小リンク
- 無効username、未設定token、rate limit、ネットワーク、空データを区別して表示

## Architecture

- React + TypeScript + Vite
- Cloudflare Workers Static Assets（Cloudflare Pagesは使用しません）
- GitHub GraphQL APIをWorker側だけから呼ぶ
- `GITHUB_TOKEN` はCloudflare secretとしてのみ使用し、ブラウザbundleへ含めない
- 庭のruntime mediaはGitに置かず、Cloudflare R2/CDNからimmutable URLで配信

```
src/worker.ts             GET /api/github/:username を処理するWorker
server/github.ts          GitHub GraphQL取得・正規化・統計
src/lib/stats.ts          純粋な統計計算
src/components/GardenCanvas.tsx
                          Contribution駆動のCanvas 2D庭レンダラー
```

## Local development

必要環境はNode.js 20以降です。

```bash
npm install
cp .env.example .env
# .envのGITHUB_TOKENにGitHub tokenをローカルで設定する
npm run dev
```

`GITHUB_TOKEN` は開発middlewareとCloudflare Workerだけで利用します。`VITE_` prefixを付けないでください。値をGit、`wrangler.jsonc`、frontend環境変数へ置かないでください。

```bash
npm test
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

## Cloudflare Workers Builds

このリポジトリはWorkers Static Assets構成です。

- build command: `npm ci && npm run build`
- deploy command: `npx wrangler deploy`
- 通常公開時は`dist/`をStatic Assetsとして配信します。一時停止中の配信対象とroutingは次項のとおりです。

GitHub repositoryをCloudflare Workerへ接続した後、**Settings → Variables and Secrets** で `GITHUB_TOKEN` をproduction secretとして登録してください。tokenの値をissue、commit、環境変数ファイル、ログへ書き込まないでください。

## Temporary publication pause

リニューアル準備のため、公開する静的ファイルを`./suspended`の停止ページだけに切り替えています。
通常のページ表示とSPA fallbackは日英の停止案内（HTTP 200）を静的配信し、旧`dist/`のアプリ・JS・CSSはアップロードしません。
`/api/*`だけをWorkerで先に処理してHTTP 503を返します。Workerへ到達したその他のリクエストも503で止め、GitHub APIやASSETS bindingを呼びません。
案内と停止応答には`no-store`と`noindex`を付けています。旧アプリを動かすscript・入力・リンクはありません。
通常の停止ページ表示をWorker invocationへ切り替えず、既存の静的配信を使います。

再公開時はこの停止変更をrevertし、通常のbuild・deployを行ってください。
停止前のコードは`acdc019af7f4428f5480467690c970dd370b615f`です。
元のassets directoryは`./dist`、`not_found_handling`は`none`、`run_worker_first`は`["/api/*", "/u/*"]`です。
Workerの本番別名には同じ停止応答が適用されますが、過去versionのpreview URLや別のホスティングサービスは個別確認が必要です。
repository、過去deploy、secret、DNS、R2素材は保持します。

## Contribution mapping

| Count | Garden state |
| --- | --- |
| 0 | Dry soil |
| 1–2 | Sprout |
| 3–5 | Grass |
| 6–10 | Flower |
| 11–20 | Bush |
| 21+ | Tree |

庭の見た目は固定パノラマではありません。各日の件数、乾いた日、カレンダー上の位置から決定的に描くため、Contributionデータが異なれば庭も変化します。

## Scope

MVPでは公開Contributionのみを扱います。OAuth、private contribution、DB、アカウント、ランキング、README SVG生成、OG画像は未実装です。

## License

[MIT](./LICENSE)
