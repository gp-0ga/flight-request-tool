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

## カレンダー一括登録の実装メモ

選択済みの往路・復路便をまとめてカレンダーに登録できるようにしている（[App.tsx](src/App.tsx)の`handleAddToCalendar`）。端末によって配信方式を3つに分けている:

- **Windows PC**: `.ics`をダウンロードしてもファイル関連付けがなくダブルクリックしても反応せず、仮に開けてもGoogleカレンダーではなくOS既定のアプリに渡るだけで登録に至らない。そのため`isWindows()`判定時は、選択済みの各便についてGoogleカレンダーのクイック追加リンク(`calendar.google.com/calendar/render?action=TEMPLATE...`、ローカル時刻+`ctz=Asia/Tokyo`)を`window.open`で新規タブとして直接開く(`buildGoogleCalendarUrl`)。ダウンロード・ファイル操作は発生しない
- **iOS**: `.ics`を`buildIcs`で生成し、Blob URLへ`location.href`で遷移してカレンダー追加のプレビュー画面を出す。**Blob + `download`属性はiOSで「ファイルに保存」に落ちてしまいカレンダー追加画面が出ないため、`download`属性は付けない。** `data:` URLへのnavigateはChromiumではセキュリティ上ブロックされるため、この経路の動作確認は開発環境のブラウザでは完結せず実機(iPhone Safari)での確認が必須
- **上記以外(Android等)**: `.ics`をBlobダウンロードするフォールバック(現状未検証・未対応、今後の課題)

`.ics`はRFC5545準拠のため、改行は`\r\n`のみ、`METHOD:PUBLISH`を付与、`UID`は`crypto.randomUUID()`でグローバルに一意化、75オクテット超の行はUTF-8バイト境界を壊さず折り返す(日本語の便名・空港名が長くなりがちなため特に重要)。

## 復路の空港を個別に変更できる機能

往路と復路で使う空港が異なるケース(自宅近くに複数空港があり、便によって行き帰りで異なる方を使う等)に対応するため、復路の出発地/目的地は往路と独立して設定できる（[App.tsx](src/App.tsx)の`inboundAirports`state）。通常時(`inboundAirports === null`)は往路の反転(目的地→出発地)を自動で使い、UIも往路と同じ簡潔な表示のまま。「復路の空港を個別に変更」を押すと`inboundAirports`に値が入り、専用の出発地/目的地セレクトが展開される。一度個別設定すると、往路を後から変更しても連動しなくなる(独立した値として保持される)。「×」で閉じると`null`に戻り、通常の反転表示に戻る。

## PC幅でのレイアウト

`lg`ブレークポイント(1024px)未満はモバイル向けレイアウトのまま変更していない。`lg`以上では:

- フォームとメッセージプレビューを2カラムで横並び表示し、右カラム(プレビュー)を左カラムと同じ高さまで伸ばして、コピー/カレンダー登録ボタンをプレビューカード下部に内包する(モバイル用の下部固定バーは`lg:hidden`で非表示にする)。ボタン列自体は`actionButtons`として1箇所で定義し、モバイル用の固定バーとPC用のカード内配置の両方で使い回している
- コンテナ幅・文字サイズをモバイル比+25%にしている(`max-w-[70rem]`、各要素に`lg:text-[...]`)。Tailwindの`text-*`ユーティリティは常にルート基準の`rem`指定で祖先の`font-size`に連動しないため、コンテナに一括でfont-sizeを設定する方法は効かず、各テキスト要素に個別で`lg:text-[...]`を付与する必要がある

## モバイルレイアウトの注意点

ネイティブの`<input type="date">`等はブラウザ(特にiOS Safari)ごとに固有の最小幅を持ち、flex/gridの子要素にしても`min-w-0`がないと隣の要素と重なることがある。横並びにする入力欄は固定の2カラムグリッドではなく`grid-cols-1 sm:grid-cols-2`のように狭幅で縦積みにする構成が安全（本プロジェクトでも実際にこれが原因の表示崩れを踏んだ）。この種の知見は個人用ツール全般に一般化して`ui-mockup-web`スキル（`~/.claude/skills/ui-mockup-web/SKILL.md`）としてまとめてある。
