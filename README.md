# 航空券予約依頼メッセージ作成ツール

北海道内の空港間を移動する出張の際、航空券予約依頼メッセージをTeams貼り付け用に作成する個人用ツール。出発地/目的地・往復or片道・日付・便を選ぶと依頼文が自動生成され、コピーやGoogleカレンダーへの一括登録ができる。往路・復路で異なる空港を使う場合にも対応。モバイル・PCどちらでも使いやすいレスポンシブ対応。

**公開URL**: https://gp-0ga.github.io/flight-request-tool/

## 開発

```bash
npm install
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド(dist/に出力)
npm run preview  # ビルド結果をローカルで確認
```

## 技術構成

Vite + React + TypeScript + Tailwind CSS + shadcn/ui。ルーターなしの単一ページSPA、バックエンドなし。

## デプロイ

`master`へpushすると GitHub Actions が自動的にビルド・GitHub Pagesへデプロイする。ブランチ運用・デプロイの詳細、実装上の注意点は [CLAUDE.md](CLAUDE.md) を参照。
