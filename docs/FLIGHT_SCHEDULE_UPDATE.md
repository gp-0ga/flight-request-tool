# 航空便データ更新手順

このツールはバックエンドを持たない静的SPAなので、航空便データはリポジトリ内の `src/data/flights.ts` を更新してデプロイします。

## 1. 変更通知

次の2種類で変更に気づけるようにしています。

- GitHub Actions `Monitor flight schedule sources`
  - 毎朝6時（日本時間）に公式ソースの `ETag` / `Last-Modified` / `Content-Length` を確認します。
  - 前回スキャンとの差分がある場合は `npm run flights:scan` が失敗し、Actions 上で確認が必要だと分かります。
- アプリ画面の通知
  - `SCHEDULE_DATA_VERSION` が利用者の前回確認済みバージョンと違う場合に「航空便データが更新されています」と表示します。
  - `SCHEDULE_VALID_TO` の14日前以降、または期限切れ後にダイヤ更新を促します。

## 2. 公式ソース確認

アプリ画面の通知パネル、または `src/data/flights.ts` の `SCHEDULE_SOURCE_LINKS` から公式ソースを開きます。

- ANA 北海道内路線時刻表
- JAL 国内線 運航路線・時刻表
- HAC 時刻表・発着案内

公式サイトで対象期間、便名、発着時刻、運航曜日、運休日を確認します。

## 3. データ更新

編集対象:

- `src/data/flights.ts`

更新する主な項目:

- `SCHEDULE_LAST_VERIFIED`
- `SCHEDULE_VALID_FROM`
- `SCHEDULE_VALID_TO`
- `SCHEDULE_DATA_VERSION`
- `SCHEDULE_SOURCE_LINKS`
- `FLIGHTS`

`SCHEDULE_DATA_VERSION` は、便データの内容を変えた日付に更新してください。これが変わると、利用者には更新通知が表示されます。

## 4. 検証

```bash
npm run flights:check
npm run lint
npm run build
```

公式ソース自体の変化を見る場合:

```bash
npm run flights:scan
```

初回または公式ソースのヘッダーが変わった場合、`data/flight-source-status.json` が更新され、コマンドは確認を促すために失敗します。内容を確認して問題なければ、その更新されたスナップショットもコミットしてください。

## 5. 公開前確認

- 代表区間で往路・復路の便が選べること
- 日付により曜日限定便が出たり消えたりすること
- 期間外の日付で警告が出ること
- メッセージプレビューとカレンダー登録内容が更新後の便名・時刻になっていること

## 6. 公開

`feature/tweaks` で検証後、`master` にマージして push します。`master` への push で GitHub Pages の本番デプロイが走ります。
