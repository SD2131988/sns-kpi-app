# SNS KPI 管理システム — セットアップガイド

## 構成
- **フロントエンド**: React
- **DB・認証**: Supabase（無料）
- **ホスティング**: Vercel（無料）

---

## STEP 1 — Supabase セットアップ

1. https://supabase.com にアクセスし、無料アカウントを作成
2. 「New Project」でプロジェクトを作成
3. Dashboard > **SQL Editor** を開き、`supabase_schema.sql` の内容を全てコピーして実行
4. Dashboard > **Settings > API** で以下をメモ
   - `Project URL`（例: https://abcdefgh.supabase.co）
   - `anon / public key`（長い文字列）

---

## STEP 2 — 最初の管理者アカウント作成

1. Supabase Dashboard > **Authentication > Users**
2. 「Invite user」で管理者のメールアドレスを招待
3. 届いたメールからパスワードを設定してログイン
4. Supabase Dashboard > **Table Editor > profiles**
5. 自分のレコードを見つけ、`role` を `admin` に変更

---

## STEP 3 — ローカル開発

```bash
# リポジトリをクローン（またはファイルをコピー）
cd sns-kpi-app

# 環境変数を設定
cp .env.local.example .env.local
# .env.local を開き、STEP 1 でメモした値を入力

# 依存関係をインストール
npm install

# 開発サーバー起動
npm start
# → http://localhost:3000 で確認
```

---

## STEP 4 — Vercel でデプロイ（無料公開）

1. https://vercel.com で無料アカウント作成
2. GitHubにコードをプッシュ（またはVercel CLIで直接デプロイ）
3. Vercel で「New Project」→ リポジトリを選択
4. **Environment Variables** に以下を追加：
   - `REACT_APP_SUPABASE_URL` = SupabaseのProject URL
   - `REACT_APP_SUPABASE_ANON_KEY` = Supabaseのanon key
5. 「Deploy」でデプロイ完了
6. 発行されたURLをチームに共有

---

## STEP 5 — メンバーをアカウント追加

1. アプリにログイン後、左メニュー「メンバー管理」を開く
2. Supabase Dashboard > Authentication > Users > 「Invite user」から招待
3. メンバーが招待メールを開き、パスワードを設定してログイン完了
4. 管理者権限を付与したい場合は「メンバー管理」画面でロールを変更

---

## 機能一覧

| 機能 | 説明 |
|------|------|
| ダッシュボード | KPIサマリ・グラフ・達成率 |
| 数値入力 | 月次データの入力・保存（予算・実績両方） |
| 推移グラフ | 月次トレンド・予算vs実績比較 |
| AIサマリ | Claudeによる自動分析レポート |
| メンバー管理 | アカウント一覧・ロール変更（管理者のみ） |

## KPI項目

- **閲覧数★**（最重要KPI）
- **フォロワー数**（サブKPI）
- 投稿数
- 広告コスト
- 各KPIの予算値・達成率
- メモ欄

## 対応ブランド・プラットフォーム

- ブランド: DS、UNY
- 地域: 国内、グローバル
- プラットフォーム: X、TikTok、Instagram、YouTube

---

## 無料枠について（2026年時点）

| サービス | 無料枠 |
|---------|--------|
| Supabase | DB 500MB、認証ユーザー数無制限、月50,000リクエスト |
| Vercel | 帯域幅100GB/月、商用利用可 |

15名程度・月次更新での利用であれば無料枠で十分カバーできます。
