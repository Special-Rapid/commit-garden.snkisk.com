# ローカルmedia検証

`media-verify.ts` は送信・upload・削除を行わず、保存証跡、consumer参照、原本、Git index、served input/outputを照合する。Node.js 22.18以降のTypeScript直接実行に対応するruntimeで使う。通常のアプリ起動・本番配信には組み込まない。

```sh
npm run media:test
npm run media:verify -- /absolute/private/media-evidence.json
npm run media:verify -- /absolute/private/media-evidence.json dist 2026-10-11T00:00:00Z
```

最後の時刻はclean buildを完了した実際の時刻に置き換える。入力だけの照合結果は出力検証の代用にならない。出力directoryはclean buildから得たものを指定する。このコマンド自身はclean buildを実行せず、時刻や証跡の真正性を証明しない。

## 証跡の形式

証跡JSONはローカル専用領域に保存し、原本のpath、approved mechanismの確認、dry-run結果、remote確認結果を公開しない。credential・token・authorization headerを記録しない。各時刻とapprovalは実際の確認記録から入力する。存在しない証跡を補完したJSONでPASSを作らない。

```ts
interface Manifest {
  version: 1;
  assets: {
    source: string; // served directory外の保存原本
    sha256: string;
    url: string;
    consumers: string[]; // repo相対の参照元ファイル
    dryRun: { at: string; url: string; mechanism: string; approved: boolean };
    remote: { at: string; url: string; status: number; contentType: string; cacheControl: string };
    switchedAt: string;
    keyApproval?: string; // digest key以外の既存キーに対する明示確認記録
  }[];
  exceptions: { path: string; sha256: string; approval: string }[];
}
```

approved mechanismは`api.snkisk.com/assets:publish`に限定する。担当者が中央uploaderの現allow-listと設定を確認し、非送信dry-runが返したURLを記録する。URLが同じoriginにあるだけでは登録確認にならない。許可範囲・必要証跡が不明なら`BLOCKED`として扱う。remote確認はHTTP 200、拡張子に対応する画像MIME、public・一年・immutable cacheを必要とする。dry-run→remote確認→consumer切替→buildの時刻順を照合する。

## 検出対象と限界

- `src`、`public`、`static`、`index.html`、`suspended`を走査する。未存在の任意directoryは空として扱うが、`src`と`index.html`の欠落やsymlinkは拒否する。
- 素材拡張子・代表的なバイナリsignature、直接記述されたmedia URL・相対path、CSS URL、HTML media属性、data URI、inline SVGを検出する。
- 原本のdigestと保存bytesを確認し、入力・出力に同じbytes・base64・hexがないこと、およびtracked/staged blobに原本がないことを照合する。
- Git所有の例外は明示承認とファイル全体のdigestに結び付ける。入力の変更・消失と、出力素材のbytes変更は拒否する。出力にある完全一致copyのみ許容する。例外のlocal参照は走査対象内の実ファイルへ解決し、digestで照合する。同じbytesをruntime原本と例外に二重分類できない。例外の選定をコマンドに任せない。

動的に組み立てたURL、任意の難読化・圧縮・画像変換、実際のrender結果はこの静的走査だけでは網羅できない。保存証跡は信頼する入力であり、remoteへ再アクセスして検証し直すものではない。`PASS`は指定された証跡との照合成功を表し、upload許可、clean buildの実行証明、公開前レビュー、実画面確認を代替しない。現在の既存mediaについても証跡・原本・例外記録が揃わなければdelivery完了にしない。
