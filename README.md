# signage-map-app

看板の設置場所を地図(フロアプラン画像 or 実地図)上にピンで管理する、ログイン無しの共有アプリ。
案件ごとの専用リンク(閲覧用/編集用)でアクセスする。看板デザイン自動化プロジェクトの一部。
設計判断の詳細は `docs/adr/` を参照。

## ローカルでの動かし方

前提: Docker Desktopが動いていること。

```bash
# 1. Supabaseのローカルスタックを起動(初回はイメージのpullで数分かかる)
npx supabase start

# 2. .env.local.example を .env.local にコピーし、
#    上のコマンドの出力にある値を貼り付ける
#    (ANON_KEY → NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY、
#     SERVICE_ROLE_KEY → SUPABASE_SERVICE_ROLE_KEY)
cp .env.local.example .env.local

# 3. Next.jsアプリをDockerで起動
docker compose up

# http://localhost:3000/new で新しい案件を作成できる
```

止めるときは `docker compose down` と `npx supabase stop`。

## できること

- `/new` で案件を作成(名前 + 地図の種類: フロアプラン画像 or 実地図)すると、閲覧用/編集用リンクへ遷移する
- 編集リンク(`/p/[viewToken]/edit/[editToken]`)では、フロアプラン画像のアップロード、地図クリックでのピン追加、ドラッグでの移動ができる
- 閲覧リンク(`/p/[viewToken]`)では地図とピンが見られる(編集不可)
- 同じピンを2箇所で同時に更新すると、後から保存しようとした側が競合エラーを受け取る(データは無言では上書きされない)

## テスト

```bash
docker compose exec web npx vitest run
# コンテナを起動していない場合は
docker compose run --rm web npx vitest run
```

## 開発時の注意

- このリポジトリはNext.js 16を使っている。訓練データの記憶だけでApp Routerのコードを書かず、`AGENTS.md` / `node_modules/next/dist/docs/` を確認すること(`CLAUDE.md` 参照)
- Node.jsは20.9+が必須(ローカルのホストのNode.jsが古い場合でも、Dockerコンテナ内は20系で動くようになっている)
