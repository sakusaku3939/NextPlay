# NextPlay
プレイ中のゲームの配信やコメントができるゲーマー向けSNS

![NextPlay - top](https://github.com/sakusaku3939/NextPlay/assets/53967490/72650b0b-d0c1-4da5-96ce-82167ae0dda7)
![NextPlay - viwer](https://github.com/sakusaku3939/NextPlay/assets/53967490/744cb06f-1c24-4c1d-9101-d6844fc0df4b)

## サーバー起動
Ruby 3.4.12 を使用します。

```
bundle install
bin/rails db:prepare
rails s
```
`https://localhost:3001/` にアクセス

## 更新時の確認

Rails はセキュリティ修正済みの 8.1.4.1 以降を使用します。
既存の動作を保つため、設定の既定値は `config.load_defaults 7.1` のままです。

```
RAILS_ENV=test bin/rails db:prepare
RAILS_ENV=test bin/rails zeitwerk:check
bundle exec bundler-audit check --update
bin/rails test
bin/rails test:system
RAILS_ENV=production SECRET_KEY_BASE_DUMMY=1 bin/rails assets:precompile
RAILS_ENV=production SECRET_KEY_BASE_DUMMY=1 bin/rails runner 'puts Rails.version; puts ActionCable.server.pubsub.class.name'
```

システムテストには Chrome/Chromium が必要です。必要に応じて `CHROME_BIN` に実行ファイルを指定してください。
CI は同じ確認を行います。ログイン・投稿、Action Cable の配信処理、画像添付、
`safe_constantize` の脆弱性修正を回帰テストで確認します。

### 再公開前に必要な確認

- 本番の PostgreSQL・Redis への接続と、ブラウザー間の実際の WebRTC 配信は別途確認が必要です。
  ローカルテストの成功は本番環境の動作確認を意味しません。
- `render.yaml` が指定する `bin/render-build.sh` は現在リポジトリにありません。
  Render で再公開する場合は、実際の構成に合わせて修正が必要です。
- 以前から存在する通常投稿の削除処理、編集画面、参加前の配信切断処理には未対応のケースがあります。
  認証・投稿の所有権チェックも再公開前に見直してください。

この更新にはデプロイ、データ移行、本番データの変更は含みません。
