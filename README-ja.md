[English](README.md)

# Commit Garden 🌱

**GitHubの公開Contributionを、生きた庭に。**

[Commit Garden](https://commit-garden.snkisk.com/)は、過去365日のGitHub公開Contributionを、乾いた土から草花・低木・木へつながる庭として描くWebアプリです。GitHubの草グラフを複製するのではなく、開発習慣をひとつの風景として振り返れるようにします。

**現在、公開を一時停止しています。** 以下の機能はローカル開発で利用できるアプリの説明です。本番では後述の停止ページを配信する構成で、リニューアルと素材作業の延期を維持しています。

## 機能

- GitHub usernameから過去365日の公開Contributionを取得します。
- total contributions、current/longest streak、average/day、most active weekday、dry daysを表示します。
- 日別の件数と位置をもとに、乾いた土・ひび・草・花・低木・木が連続して育つCanvas庭園を描画します。
- キーボード、クリック、タップで任意の日を選び、日付とContribution件数を確認できます。
- System / Light / Dark themeと日本語 / Englishを切り替え、保存します。
- 共有URLのコピーとGitHubプロフィールへの最小リンクを提供します。
- 無効username、未設定token、rate limit、ネットワーク、空データを区別して表示します。存在しないユーザーの正しい案内は[Issue #3](https://github.com/Special-Rapid/commit-garden.snkisk.com/issues/3)で対応中です。

## 構成

- React + TypeScript + Viteを使用します。
- Cloudflare Workers Static Assets構成で、Cloudflare Pagesは使用しません。
- GitHub GraphQL APIはサーバー側だけから呼びます。
- 本番の`GITHUB_TOKEN`はCloudflare secretとして使用し、ブラウザbundleへ含めません。
- 庭のruntime mediaはGitに置かず、Cloudflare R2/CDNからimmutable URLで配信します。

| 場所 | 役割 |
| --- | --- |
| [src/](src/) | ReactアプリとWorkerの入口 |
| [src/worker.ts](src/worker.ts) | Workerと`GET /api/github/:username`の処理。現在は停止中 |
| [server/](server/) | GraphQL取得・正規化・統計と開発middleware |
| [src/lib/stats.ts](src/lib/stats.ts) | 純粋な統計計算 |
| [src/components/GardenCanvas.tsx](src/components/GardenCanvas.tsx) | Contribution駆動のCanvas 2D庭レンダラー |
| [suspended/](suspended/) | 本番用の静的停止ページとheaders |

## ローカル開発

Node.js 22.12以降の要件を満たす、保守中の修正版Node.jsを使用してください。WranglerはNode.js 22以降、Viteは同系列で22.12以降が必要です。ローカル検証ではNode.js 24.22.1とnpm 10・npm 11を使用しています。

```bash
npm ci
cp .env.example .env
# .envのGITHUB_TOKENにGitHub tokenをローカルで設定します。
npm run dev
```

開発サーバーは`http://127.0.0.1:5173`で起動し、本番の停止処理とは独立したアプリとサーバー側middlewareを使用します。

`GITHUB_TOKEN`は開発middlewareとCloudflare Workerだけで利用します。`VITE_` prefixは付けないでください。tokenの値をGit、`wrangler.jsonc`、frontend環境変数、Issue、commit、ログへ置かないでください。

```bash
npm test
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

dry-runは現在の停止中Worker・assets構成を公開せずに確認します。buildやdry-runの成功だけで、公開サービスを確認できたとは扱わないでください。

## Cloudflare Workers Builds

このリポジトリはWorkers Static Assets構成です。

- build command: `npm ci && npm run build`
- deploy command: `npx wrangler deploy`
- 通常公開時は`dist/`をStatic Assetsとして配信します。一時停止中の配信対象とroutingは次項のとおりです。

承認済みの本番接続を設定するときは、**Settings → Variables and Secrets**で`GITHUB_TOKEN`をproduction secretとして登録します。値を公開しないでください。この説明はdeployや公開再開の許可ではありません。

## 公開の一時停止

本番のassets directoryは、停止ページだけを含む`./suspended`に設定しています。通常のページ表示とSPA fallbackは日英の停止案内をHTTP 200で静的配信する構成で、旧`dist/`のアプリ・JS・CSSはアップロードしません。

`/api/*`だけをWorkerで先に処理してHTTP 503を返します。Workerへ到達したその他のリクエストも503で止め、GitHub APIやASSETS bindingを呼びません。案内と停止応答には`no-store`と`noindex`を付けており、旧アプリを動かすscript・入力・リンクはありません。通常の停止ページ表示ではWorkerを呼び出さず、既存の静的配信を使います。これらのHTTP statusは設定上の挙動であり、現在の公開到達性を保証するものではありません。

再公開には別途承認を得たうえで、停止変更を戻し、通常のbuild・deploy確認が必要です。停止前のコードは`acdc019af7f4428f5480467690c970dd370b615f`です。元のassets directoryは`./dist`、`not_found_handling`は`none`、`run_worker_first`は`["/api/*", "/u/*"]`です。復旧を準備するときは、その後の依存修正も保持してください。

Workerの本番別名には同じ停止応答が適用されますが、過去versionのpreview URLや別のホスティングサービスは個別確認が必要です。repository、過去deploy、secret、DNS、R2素材は保持します。

## Contributionの対応

| 件数 | 庭の状態 |
| --- | --- |
| 0 | 乾いた土 |
| 1–2 | 芽 |
| 3–5 | 草 |
| 6–10 | 花 |
| 11–20 | 低木 |
| 21+ | 木 |

庭の見た目は固定パノラマではありません。各日の件数、乾いた日、カレンダー上の位置から決定的に描くため、Contributionデータが異なれば庭も変化します。

## 対象範囲

MVPでは公開Contributionのみを扱います。OAuth、private contribution、DB、アカウント、ランキング、README SVG生成、OG画像は未実装です。

## ライセンス

[MIT](LICENSE)。既存の著作権表示を保持しています。依存と外部素材にはそれぞれのライセンス条件が適用されます。
