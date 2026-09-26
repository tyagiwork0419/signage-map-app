# 0001. 技術スタックの選定

## ステータス
承認済み

## コンテキスト
看板デザイン自動化プロジェクトの一環として、お客さんが看板の設置場所を自分で指定できる、
スマホ・PC両対応の簡易ウェブアプリを新規に立ち上げる。要件は以下の通り。

- ログイン無し。案件ごとのユニークリンク(閲覧用/編集用)を発行して共有
- レスポンシブ(タップ/マウス・キーボードを自動判定)
- 地図タップ等の重い処理はクライアント側で完結、サーバーは保存時のみ呼ぶ
- 想定同時アクセスは10箇所程度。処理負荷よりデータ競合対策が重要
- サーバー構成はSupabase(DB・認証・API)+Vercel(ホスティング)を想定
- まずはDockerでローカル確認できる状態を作る。本番デプロイは別段階

## 検討した選択肢
- **フロントエンド**
  - Next.js(App Router)+ TypeScript: Vercelを作っている会社の製品であり、Vercelへのデプロイが最も枯れている。SSR/CSRの使い分けも柔軟
  - Vite + React(SPA): ビルドは軽量だが、Vercelとの統合の手厚さでNext.jsに劣る
  - → Next.jsを採用。Vercelデプロイが確定要件のため、迷う余地が小さい
- **バックエンド**
  - Supabase(Postgres + Auth + Storage + 自動生成REST/RPC): 要件で名指しされている。ローカル開発はSupabase CLIが公式にDocker Composeスタックを提供
  - Firebase等の他BaaS: 要件外、検討せず
  - → Supabaseを採用(要件による確定)

## 決定
- フロントエンド: Next.js(App Router)+ TypeScript + Tailwind CSS
- バックエンド: Supabase(ローカルは `supabase start` によるDocker Composeスタック)
- ローカル確認: `supabase start` でSupabaseスタックを起動 + Next.jsアプリ用の軽量な `docker-compose.yml` を用意し、`docker compose up` でアプリコンテナも起動できるようにする
- 本番: Vercel(フロントエンド)+ Supabaseクラウド(本ADRの対象外、後日着手)

## 結果・トレードオフ
- Next.js + Supabaseは組み合わせ事例が多く、詰まったときの情報が見つけやすい
- Supabase CLIのローカルスタックは初回起動時にDockerイメージのpullで時間がかかる
- Vercelデプロイ時の環境変数管理(本番Supabaseプロジェクトの鍵)は今後のADRで扱う
