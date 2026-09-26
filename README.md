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
#    上のコマンドの出力にある ANON_KEY を NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY に貼り付ける
cp .env.local.example .env.local

# 3. Next.jsアプリをDockerで起動
docker compose up

# http://localhost:3000 で確認できる
```

止めるときは `docker compose down` と `npx supabase stop`。

## テスト

```bash
docker compose exec web npx vitest run
# コンテナを起動していない場合は
docker compose run --rm web npx vitest run
```

## 開発時の注意

- このリポジトリはNext.js 16を使っている。訓練データの記憶だけでApp Routerのコードを書かず、`AGENTS.md` / `node_modules/next/dist/docs/` を確認すること(`CLAUDE.md` 参照)
- Node.jsは20.9+が必須(ローカルのホストのNode.jsが古い場合でも、Dockerコンテナ内は20系で動くようになっている)
