# Stella Coin - Fiterre会員管理システム

パーソナルジムFiterreの会員向けポイント管理・予約システム

## 🌟 機能概要

### 会員（ユーザー）向け
- **コイン管理**: 残高確認、取引履歴、有効期限表示
- **予約システム**: メンター選択、日時指定、キャンセル機能
- **トレーニング記録**: 日次ログ・月次レポート閲覧
- **Fitest**: 昇格試験の結果確認、進捗表示
- **チェックイン**: 来店時のコード表示、来店履歴
- **LINE連携**: 通知設定、アカウント連携

### メンター向け
- **予約管理**: 担当予約の確認
- **トレーニング記録**: 顧客の記録入力
- **Fitest実施**: 試験結果の入力・判定
- **チェックイン処理**: 来店認証・ポイント付与

### 管理者向け
- **ユーザー管理**: 会員情報・コイン付与
- **コイン管理**: 一括付与・取引履歴・期限管理
- **メンター管理**: メンター情報・権限設定
- **シフト管理**: シフト登録・編集
- **分析ダッシュボード**: 統計・グラフ表示
- **システム設定**: 各種パラメータ設定

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **UIコンポーネント**: shadcn/ui
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **メール**: Resend
- **LINE連携**: LINE Messaging API
- **デプロイ**: Vercel

## 📦 セットアップ

### 1. リポジトリのクローン
```bash
git clone https://github.com/Fiterre/fiterre-point.git
cd fiterre-point
```

### 2. 依存関係のインストール
```bash
npm install
```

### 3. 環境変数の設定

`.env.local` を作成:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend
RESEND_API_KEY=your_resend_api_key

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. データベースセットアップ

Supabase SQL Editorで以下のSQLファイルを順番に実行:

1. `docs/sql/01_profiles.sql` - プロフィール・認証
2. `docs/sql/02_coins.sql` - コインシステム
3. `docs/sql/03_reservations.sql` - 予約システム
4. `docs/sql/04_training.sql` - トレーニング記録
5. `docs/sql/05_fitest.sql` - Fitestシステム
6. `docs/sql/06_checkin.sql` - チェックイン
7. `docs/sql/07_settings.sql` - システム設定

### 5. 開発サーバーの起動
```bash
npm run dev
```

http://localhost:3000 でアクセス

## 📁 ディレクトリ構造

```
fiterre-point/
├── app/
│   ├── (auth)/                    # 認証関連ページ
│   │   ├── auth/callback/         # OAuth コールバック
│   │   ├── login/                 # ログイン
│   │   └── signup/                # 新規登録
│   ├── (dashboard)/               # 認証済みエリア
│   │   ├── admin/                 # 管理者画面
│   │   │   ├── analytics/         # 分析ダッシュボード
│   │   │   ├── coins/             # コイン管理
│   │   │   ├── mentors/           # メンター管理
│   │   │   ├── recurring/         # 固定予約
│   │   │   ├── settings/          # システム設定
│   │   │   ├── shifts/            # シフト管理
│   │   │   └── users/             # ユーザー管理
│   │   ├── dashboard/             # ユーザー画面
│   │   │   ├── checkin/           # チェックイン
│   │   │   ├── fitest/            # Fitest結果
│   │   │   ├── history/           # コイン履歴
│   │   │   ├── records/           # トレーニング記録
│   │   │   ├── reservations/      # 予約
│   │   │   └── settings/          # 設定・LINE連携
│   │   └── mentor/                # メンター画面
│   │       ├── checkin/           # チェックイン処理
│   │       ├── fitest/            # Fitest実施
│   │       ├── records/           # トレーニング記録入力
│   │       └── reservations/      # 予約管理
│   └── api/                       # APIエンドポイント
│       ├── admin/                 # 管理者API
│       ├── auth/                  # 認証API
│       ├── checkin/               # チェックインAPI
│       ├── mentor/                # メンターAPI
│       ├── mentors/               # メンター情報API
│       ├── reservations/          # 予約API
│       └── user/                  # ユーザーAPI
├── components/
│   ├── features/                  # 機能別コンポーネント
│   │   ├── admin/                 # 管理者用
│   │   ├── auth/                  # 認証関連
│   │   ├── checkin/               # チェックイン
│   │   ├── dashboard/             # ダッシュボード
│   │   ├── fitest/                # Fitest
│   │   ├── mentor/                # メンター
│   │   ├── records/               # トレーニング記録
│   │   ├── reservations/          # 予約
│   │   └── settings/              # 設定
│   └── ui/                        # shadcn/ui コンポーネント
├── hooks/                         # カスタムフック
├── lib/
│   ├── line/                      # LINE Messaging API
│   ├── queries/                   # データベースクエリ関数
│   └── supabase/                  # Supabase クライアント
├── types/                         # TypeScript 型定義
└── docs/
    └── sql/                       # データベースSQL
```

## 🔐 認証・権限

| ロール | アクセス範囲 |
|--------|-------------|
| ユーザー | `/dashboard/*` |
| メンター | `/dashboard/*` + `/mentor/*` |
| 管理者 | `/dashboard/*` + `/mentor/*` + `/admin/*` |

## 🎨 テーマ

| 画面 | カラー | 説明 |
|------|--------|------|
| ユーザー | ホワイト / アンバー | 会員向けダッシュボード |
| メンター | エメラルド | メンター専用画面 |
| 管理者 | ダークグレー | 管理者パネル |

## 📝 ライセンス

Private - Fiterre Inc.
