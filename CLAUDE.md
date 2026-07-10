# flight-request-tool

北海道内の空港間を移動する出張の際、航空券予約依頼メッセージをTeams貼り付け用に作成する個人用ツール。出発地/目的地・往復or片道・日付・便を選ぶと、事務担当に送る依頼文が自動生成され、コピーやカレンダー一括登録ができる。

## 技術構成

Vite + React + TypeScript + Tailwind CSS + shadcn/ui。ルーターなし・単一ページのSPA。バックエンドは持たず、便・空港データは[src/data/flights.ts](src/data/flights.ts)・[src/data/airports.ts](src/data/airports.ts)にハードコードされた静的データ（出典・更新時期の注意点はファイル内コメント参照）。

## デプロイ構成

- `master`へのpushで[.github/workflows/deploy.yml](.github/workflows/deploy.yml)（GitHub Actions）が自動実行され、GitHub Pagesへ本番反映される
- 本番URL: https://gp-0ga.github.io/flight-request-tool/
- GitHub PagesはリポジトリのサブパスHTTPS配信（`https://<user>.github.io/<repo>/`）のため、[vite.config.ts](vite.config.ts)に`base: '/flight-request-tool/'`が必須。これがないとビルド後のJS/CSSの絶対パス参照(`/assets/...`)が本番で404になる
- GitHub側の設定として、Settings → Pages → Source が「GitHub Actions」になっている必要がある（すでに設定済み。リポジトリを作り直す場合は再設定が必要）

## ブランチ運用

- `master` = 本番。pushすると即座にGitHub Pagesへ反映されるため、動作確認済みの変更のみをマージする
- `feature/tweaks` = 機能追加・修正の作業ブランチ。ここでコミットを積み、確認できたら`master`に`--no-ff`でマージしてpushする
- ドキュメントのみの変更など、ビルド成果物に影響しない変更は`master`に直接コミットしてよい

## iPhone実機確認用のプレビュー公開（Surge）

GitHub Pagesとは別に、モバイル（特にiOS Safari）での見た目・挙動を実機で確認したい場合はSurgeに仮公開できる。

```bash
npx vite build --base=./   # 相対パスでビルド(vite.config.tsは変更しない)
surge ./dist flight-request-tweaks.surge.sh
```

Surgeはドメイン直下配信のため、GitHub Pages用の`base: '/flight-request-tool/'`のままビルドするとアセットが404になる。`--base=./`で一時的に相対パスビルドを作るのがポイント。`vite.config.ts`自体は変更・コミットしない。

## カレンダー一括登録(.ics)の実装メモ

選択済みの往路・復路便をまとめて1つの`.ics`としてダウンロードさせ、複数イベントを一括登録できるようにしている（[App.tsx](src/App.tsx)の`buildIcs`/`handleAddToCalendar`）。iOS Safari対応で以下の点が重要:

- **Blob + `download`属性はiOSで「ファイルに保存」に落ちる。** カレンダー追加のプレビュー画面を出すには、`download`属性を付けずBlob URLへ`location.href`で遷移する必要がある(`type: 'text/calendar;charset=utf-8;method=PUBLISH'`)
- **data: URLへのnavigateはChromiumではセキュリティ上ブロックされる**ため、この経路の動作確認は開発環境のブラウザでは完結せず、実機(iPhone Safari)での確認が必須
- RFC5545準拠のため、`.ics`生成は以下を満たす: 改行は`\r\n`のみ、`METHOD:PUBLISH`を付与、`UID`は`crypto.randomUUID()`でグローバルに一意化、75オクテット超の行はUTF-8バイト境界を壊さず折り返す(日本語の便名・空港名が長くなりがちなため特に重要)

## モバイルレイアウトの注意点

ネイティブの`<input type="date">`等はブラウザ(特にiOS Safari)ごとに固有の最小幅を持ち、flex/gridの子要素にしても`min-w-0`がないと隣の要素と重なることがある。横並びにする入力欄は固定の2カラムグリッドではなく`grid-cols-1 sm:grid-cols-2`のように狭幅で縦積みにする構成が安全（本プロジェクトでも実際にこれが原因の表示崩れを踏んだ）。この種の知見は個人用ツール全般に一般化して`ui-mockup-web`スキル（`~/.claude/skills/ui-mockup-web/SKILL.md`）としてまとめてある。
