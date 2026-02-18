# Stella Coin 機能分析レポート

> 分析日: 2026-02-18
> 対象: Fiterre Point (Stella Coin) - Next.js 16 + Supabase

---

## 目次

1. [ルーティング分析](#1-ルーティング分析)
2. [API分析](#2-api分析)
3. [データベーステーブル分析](#3-データベーステーブル分析)
4. [コンポーネント分析](#4-コンポーネント分析)
5. [機能別の実装状況](#5-機能別の実装状況)
6. [今後の拡張計画との照合](#6-今後の拡張計画との照合)
7. [総合サマリー](#7-総合サマリー)

---

## 1. ルーティング分析

### 全ページ一覧（34ページ）

#### 認証ページ（3ページ）

| ルート | ファイル | 機能 |
|--------|----------|------|
| `/` | `app/page.tsx` | ランディングページ。Stella Coinブランド表示、ログイン/サインアップボタン |
| `/login` | `app/(auth)/login/page.tsx` | メール/パスワードログイン。ロールに応じたリダイレクト |
| `/signup` | `app/(auth)/signup/page.tsx` | 新規ユーザー登録。表示名・メール・パスワード入力、確認メール送信 |

#### ユーザーダッシュボード（10ページ）

| ルート | ファイル | 機能 |
|--------|----------|------|
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx` | メインダッシュボード。コイン残高、クイックアクション、直近予約 |
| `/dashboard/reservations` | `app/(dashboard)/dashboard/reservations/page.tsx` | 予約一覧。今後の予約・過去の予約、キャンセルボタン |
| `/dashboard/reservations/new` | `app/(dashboard)/dashboard/reservations/new/page.tsx` | 新規予約作成。セッション種別・メンター選択・残高表示 |
| `/dashboard/history` | `app/(dashboard)/dashboard/history/page.tsx` | コイン取引履歴。付与/消費のタイプ別バッジ、残高推移 |
| `/dashboard/records` | `app/(dashboard)/dashboard/records/page.tsx` | トレーニング記録閲覧。日報・月報タブ切替 |
| `/dashboard/records/[id]` | `app/(dashboard)/dashboard/records/[id]/page.tsx` | 記録詳細。エクササイズ内容（セット/回数/重量）、メモ |
| `/dashboard/fitest` | `app/(dashboard)/dashboard/fitest/page.tsx` | Fitest履歴。進捗カード、次回テスト日、マイルストーン |
| `/dashboard/fitest/[id]` | `app/(dashboard)/dashboard/fitest/[id]/page.tsx` | Fitest結果詳細。合否、スコア、Big3、体重予測、講評 |
| `/dashboard/checkin` | `app/(dashboard)/dashboard/checkin/page.tsx` | チェックインコード表示（QR）、来店回数、ボーナスコイン |
| `/dashboard/settings` | `app/(dashboard)/dashboard/settings/page.tsx` | LINE連携、通知設定、アカウント情報表示 |

#### メンターページ（7ページ ※うち2ページ欠落）

| ルート | ファイル | 機能 |
|--------|----------|------|
| `/mentor` | `app/(dashboard)/mentor/page.tsx` | メンターダッシュボード。クイックアクション、今日の予約 |
| `/mentor/reservations` | `app/(dashboard)/mentor/reservations/page.tsx` | 今日の予約・今後の確定予約 |
| `/mentor/records` | `app/(dashboard)/mentor/records/page.tsx` | 作成した記録一覧。日報/月報追加ボタン |
| `/mentor/records/new` | `app/(dashboard)/mentor/records/new/page.tsx` | トレーニング記録作成フォーム |
| `/mentor/fitest` | `app/(dashboard)/mentor/fitest/page.tsx` | Fitest管理。月次実施数、合格数、最近の結果 |
| `/mentor/fitest/new` | `app/(dashboard)/mentor/fitest/new/page.tsx` | Fitest実施・記録フォーム |
| `/mentor/checkin` | `app/(dashboard)/mentor/checkin/page.tsx` | チェックイン処理。コード入力、今日のチェックイン数 |

#### 管理者ページ（14ページ）

| ルート | ファイル | 機能 |
|--------|----------|------|
| `/admin` | `app/(dashboard)/admin/page.tsx` | 管理ダッシュボード。統計カード、最新登録、ランキング |
| `/admin/users` | `app/(dashboard)/admin/users/page.tsx` | ユーザー一覧テーブル。ロール/ステータス/ランクバッジ |
| `/admin/users/[id]` | `app/(dashboard)/admin/users/[id]/page.tsx` | ユーザー詳細。基本情報、契約、残高、コイン付与、停止/削除 |
| `/admin/mentors` | `app/(dashboard)/admin/mentors/page.tsx` | メンター一覧。アクティブ/非アクティブ数、ティア |
| `/admin/mentors/new` | `app/(dashboard)/admin/mentors/new/page.tsx` | メンター新規登録フォーム |
| `/admin/mentors/[id]` | `app/(dashboard)/admin/mentors/[id]/page.tsx` | メンター詳細。ティア設定、シフトカレンダー、無効化/削除 |
| `/admin/shifts` | `app/(dashboard)/admin/shifts/page.tsx` | シフト一覧。メンター別の週間カレンダー表示 |
| `/admin/shifts/new` | `app/(dashboard)/admin/shifts/new/page.tsx` | シフト追加フォーム |
| `/admin/schedule` | `app/(dashboard)/admin/schedule/page.tsx` | スケジュールブロック管理（休館日・メンテナンス） |
| `/admin/recurring` | `app/(dashboard)/admin/recurring/page.tsx` | 固定予約管理。カウントダウン、トリガーステータス、曜日別一覧 |
| `/admin/recurring/new` | `app/(dashboard)/admin/recurring/new/page.tsx` | 固定予約作成フォーム |
| `/admin/coins` | `app/(dashboard)/admin/coins/page.tsx` | コイン管理。一括付与/取引履歴/期限切れタブ |
| `/admin/analytics` | `app/(dashboard)/admin/analytics/page.tsx` | 分析ダッシュボード。予約/ユーザー/コイン推移チャート |
| `/admin/settings` | `app/(dashboard)/admin/settings/page.tsx` | システム設定（7タブ: システム/コイン/自動処理/営業時間/権限/外観/ジム情報） |

### リンク先が存在しないページ（404候補）

| リンク元 | リンク先 | 状態 |
|----------|----------|------|
| `/mentor` (メンターダッシュボード) | `/mentor/customers` | **ページ未実装** - 顧客一覧ページが存在しない |
| `/mentor` (メンターダッシュボード) | `/mentor/schedule` | **ページ未実装** - スケジュールページが存在しない |

### プレースホルダーページ

**なし** - 全34ページが実際の機能を持つ完全な実装

---

## 2. API分析

### 全APIエンドポイント一覧（31エンドポイント）

#### 認証 API（3エンドポイント）

| エンドポイント | メソッド | 機能 |
|---------------|----------|------|
| `/api/auth/permissions` | GET | ユーザーのロール・ティア・権限を取得 |
| `/api/auth/redirect` | GET | ロールに応じたリダイレクト先を決定 |
| `/api/auth/signout` | POST | ログアウト処理 |

#### チェックイン API（2エンドポイント）

| エンドポイント | メソッド | 機能 |
|---------------|----------|------|
| `/api/checkin` | POST | チェックイン記録。ボーナスコイン自動付与 |
| `/api/checkin/verify` | POST | 6桁チェックインコードの検証 |

#### LINE API（1エンドポイント）

| エンドポイント | メソッド | 機能 |
|---------------|----------|------|
| `/api/line/webhook` | POST | LINE Webhookイベント処理（フォロー/アンフォロー） |

#### ユーザー API（4エンドポイント）

| エンドポイント | メソッド | 機能 |
|---------------|----------|------|
| `/api/user/cancel-stats` | GET | キャンセル統計・履歴取得 |
| `/api/user/checkin-code` | POST | チェックイン用6桁コード生成 |
| `/api/user/line/connect` | POST | LINEアカウント連携 |
| `/api/user/line/disconnect` | POST | LINEアカウント連携解除 |

#### メンター API（3エンドポイント）

| エンドポイント | メソッド | 機能 |
|---------------|----------|------|
| `/api/mentor/fitest` | POST | Fitest結果記録・ランク更新 |
| `/api/mentor/records` | POST | トレーニング記録作成 |
| `/api/mentors/available` | GET | 指定日時の空きメンター取得 |

#### 予約 API（2エンドポイント）

| エンドポイント | メソッド | 機能 |
|---------------|----------|------|
| `/api/reservations` | POST | 予約作成（FIFO消費、28日ルール、バリデーション） |
| `/api/reservations/[id]/cancel` | GET, POST | キャンセル可否チェック(GET) / キャンセル実行(POST) |

#### 管理者 - コイン API（3エンドポイント）

| エンドポイント | メソッド | 機能 |
|---------------|----------|------|
| `/api/admin/grant-coins` | POST | 個別コイン付与（取引履歴記録） |
| `/api/admin/coins/bulk-grant` | POST | 一括コイン付与（複数ユーザー、90日期限） |
| `/api/admin/coins/extend` | POST | コイン有効期限の一括延長 |

#### 管理者 - メンター API（3エンドポイント）

| エンドポイント | メソッド | 機能 |
|---------------|----------|------|
| `/api/admin/mentors` | POST | メンター新規登録（ユーザー作成含む） |
| `/api/admin/mentors/[id]` | PATCH, DELETE | 有効/無効切替(PATCH) / 削除(DELETE) |
| `/api/admin/mentors/tier` | POST | メンターティア変更 |

#### 管理者 - 固定予約 API（2エンドポイント）

| エンドポイント | メソッド | 機能 |
|---------------|----------|------|
| `/api/admin/recurring` | POST | 固定予約作成 |
| `/api/admin/recurring/execute` | POST | 固定予約の月次実行（残高バリデーション付き） |

#### 管理者 - スケジュール API（2エンドポイント）

| エンドポイント | メソッド | 機能 |
|---------------|----------|------|
| `/api/admin/reservations/block` | GET, POST | ブロック枠一覧(GET) / 作成(POST) |
| `/api/admin/reservations/block/[id]` | DELETE | ブロック枠削除 |

#### 管理者 - 設定 API（4エンドポイント）

| エンドポイント | メソッド | 機能 |
|---------------|----------|------|
| `/api/admin/settings` | POST | システム設定更新（営業時間、ジム情報、外観等） |
| `/api/admin/settings/presets` | GET | コイン付与プリセット取得 |
| `/api/admin/settings/closures` | POST, DELETE | 休館日追加/削除 |
| `/api/admin/settings/permissions` | POST | メンターティア権限更新 |

#### 管理者 - シフト API（1エンドポイント）

| エンドポイント | メソッド | 機能 |
|---------------|----------|------|
| `/api/admin/shifts` | POST | シフトテンプレート作成 |

#### 管理者 - ユーザー API（1エンドポイント）

| エンドポイント | メソッド | 機能 |
|---------------|----------|------|
| `/api/admin/users/[id]/status` | PATCH | ユーザーステータス変更（active/suspended/locked/deleted） |

### 呼び出されているが存在しないAPI

**なし** - 全てのfetch()呼び出しが対応するroute.tsを持つ

---

## 3. データベーステーブル分析

### 定義されている型（types/database.ts）

#### コアテーブル型（18型）

| 型名 | 対応テーブル | クエリ使用 |
|------|-------------|-----------|
| `Profile` | `profiles` | ✅ 多数 |
| `SubscriptionPlan` | `subscription_plans` | ✅ JOIN経由 |
| `UserSubscription` | `user_subscriptions` | ✅ customers.ts |
| `CoinLedger` | `coin_ledgers` | ✅ 多数 |
| `Transaction` | `coin_transactions` | ✅ 多数 |
| `Mentor` | `mentors` | ✅ 多数 |
| `Reservation` | `reservations` | ✅ 多数 |
| `SessionType` | `session_types` | ✅ reservations.ts |
| `MentorShift` | `mentor_shifts` | ✅ shifts.ts |
| `RecurringReservation` | `recurring_reservations` | ✅ shifts.ts |
| `RecurringReservationLog` | `recurring_reservation_logs` | ✅ shifts.ts |
| `RoleTier` | `role_tiers` | ✅ permissions.ts |
| `UserRoleWithTier` | `user_roles` | ✅ auth.ts |
| `TrainingRecord` | `training_records` | ✅ trainingRecords.ts |
| `FitestResult` | `fitest_results` | ✅ fitest.ts |
| `FitestMilestone` | `fitest_milestones` | ✅ fitest.ts |
| `VerificationCode` | `verification_codes` | ✅ checkIn.ts |
| `CheckInLog` | `check_in_logs` | ✅ checkIn.ts |

#### ビュー型（1型）

| 型名 | 用途 |
|------|------|
| `UserBalance` | コイン残高サマリー |

#### リレーション型（7型）

| 型名 | 用途 |
|------|------|
| `MentorWithProfile` | メンター＋プロフィールJOIN結果 |
| `ReservationWithDetails` | 予約＋セッション種別＋メンターJOIN結果 |
| `MentorShiftWithProfile` | シフト＋メンター＋プロフィールJOIN結果 |
| `RecurringReservationWithDetails` | 固定予約＋ユーザー＋メンターJOIN結果 |
| `TrainingRecordWithRelations` | トレーニング記録＋メンター＋ユーザーJOIN結果 |
| `FitestResultWithRelations` | Fitest結果＋メンター＋ユーザーJOIN結果 |
| `CheckInLogWithRelations` | チェックインログ＋ユーザーJOIN結果 |

#### Enum型（7型）

`UserRole`, `AccountStatus`, `MemberRank`, `LedgerStatus`, `TransactionType`, `ReservationStatus`, `FitestLevel`

### クエリで使用されているが型定義が不足しているテーブル

| テーブル名 | 使用ファイル | 状態 |
|-----------|-------------|------|
| `training_sessions` | cancellation.ts | **型未定義** - cancellation.tsのみで参照 |
| `business_closures` | businessHours.ts | **型未定義** - インライン型定義のみ |
| `system_settings` | settings.ts | **型未定義** - インライン型定義のみ（settings.ts内の`SystemSetting`） |

### RPC / データベース関数

| 関数名 | ファイル | 機能 |
|--------|----------|------|
| `increment_visit_count` | checkIn.ts | プロフィールの`total_visits`をインクリメント（フォールバック付き） |

---

## 4. コンポーネント分析

### 全コンポーネント一覧（54 feature + 13 UI = 67コンポーネント）

#### features/ コンポーネント（54件）

| ディレクトリ | コンポーネント | 使用状況 |
|-------------|---------------|----------|
| **auth/** | TierBadge, LogoutButton, PermissionGate | 1/3 使用中 |
| **dashboard/** | BalanceCard, CoinRankingCard | 2/2 使用中 |
| **checkin/** | CheckInCodeDisplay, CheckInForm, RecentCheckInsList, UserCheckInHistory | 4/4 使用中 |
| **records/** | DailyRecordsList, MonthlyReportsList | 2/2 使用中 |
| **fitest/** | FitestForm, FitestHistoryList, FitestProgressCard, RecentFitestList | 4/4 使用中 |
| **mentor/** | MentorRecordsList, RecordForm | 2/2 使用中 |
| **reservations/** | CancelReservationButton, CancelSuggestionBanner, ReservationForm | 3/3 使用中 |
| **settings/** | LineConnectButton, NotificationSettings | 2/2 使用中 |
| **admin/** | ExecuteRecurringButton, GrantCoinsForm, RecurringReservationForm, ShiftForm | 4/4 使用中 |
| **admin/analytics/** | CoinFlowChart, MentorStatsTable, ReservationChart | 3/3 使用中 |
| **admin/coins/** | BulkGrantTab, TransactionHistoryTab, ExpiringCoinsTab, BulkGrantForm, TransactionHistoryView, ExpiringCoinsView | 6/6 使用中（内部参照含む） |
| **admin/customers/** | CustomerRankBadge, CustomerLoginInfo, FitestCountdown, UserStatusActions | 4/4 使用中 |
| **admin/mentors/** | MentorTierSelector, MentorActions | 2/2 使用中 |
| **admin/settings/** | SystemSettingsTab/Form, BusinessHoursTab/Form, PermissionsTab/Form, AppearanceTab/Form, GymInfoTab/Form, TriggerSettingsTab, CoinPresetsTab/Form | 13/13 使用中（Tab→Form内部参照） |

#### 未使用コンポーネント

| コンポーネント | ファイル | 備考 |
|---------------|----------|------|
| `LogoutButton` | components/features/auth/LogoutButton.tsx | サイドバーに直接ログアウト実装済みのため不要 |
| `PermissionGate` | components/features/auth/PermissionGate.tsx | 権限ラッパー。将来的に利用可能 |
| `avatar.tsx` | components/ui/avatar.tsx | 未使用UIコンポーネント |
| `skeleton.tsx` | components/ui/skeleton.tsx | 未使用UIコンポーネント（ローディング状態で活用可能） |

### 存在しないコンポーネントへのインポート

**なし** - 全てのインポートが正常に解決

---

## 5. 機能別の実装状況

### ユーザー機能

| 機能 | 状態 | 詳細 |
|------|------|------|
| ログイン/サインアップ | ✅ 完全実装 | メール/パスワード認証、ロール別リダイレクト |
| プロフィール編集 | ⬜ プレースホルダーのみ | 設定ページに表示のみ。編集フォーム・APIなし |
| パスワード変更 | ❌ 未実装 | UIもAPIも存在しない |
| コイン残高表示 | ✅ 完全実装 | 利用可能/ロック中/合計を表示 |
| コイン取引履歴 | ✅ 完全実装 | タイプ別バッジ、金額、残高推移 |
| 予約作成 | ✅ 完全実装 | セッション種別・メンター選択、FIFO消費、28日ルール |
| 予約キャンセル | ✅ 完全実装 | 前日23:59 JST期限、コイン返却 |
| 予約履歴 | ✅ 完全実装 | 今後/過去の予約一覧、ステータスバッジ |
| トレーニング記録閲覧 | ✅ 完全実装 | 日報/月報タブ、詳細表示 |
| Fitest結果閲覧 | ✅ 完全実装 | 進捗カード、結果詳細、マイルストーン |
| チェックインコード表示 | ✅ 完全実装 | 6桁コード生成、QR表示、来店回数 |
| 来店履歴 | ✅ 完全実装 | チェックインページ内に表示 |
| LINE連携 | ✅ 完全実装 | 接続/切断、Webhook処理 |
| 通知設定 | ⬜ プレースホルダーのみ | UIスイッチ存在するが保存ロジックなし（`// APIに保存（将来実装）`） |

### メンター機能

| 機能 | 状態 | 詳細 |
|------|------|------|
| ダッシュボード | ✅ 完全実装 | クイックアクション、今日の予約表示 |
| 予約管理 | ✅ 完全実装 | 今日/今後の予約一覧 |
| トレーニング記録入力 | ✅ 完全実装 | 日報/月報作成フォーム |
| Fitest実施・入力 | ✅ 完全実装 | スコア入力、合否判定、ランク更新 |
| チェックイン処理 | ✅ 完全実装 | コード検証、記録作成、ボーナスコイン付与 |
| 顧客一覧 | ❌ 未実装 | リンク存在するがページなし（404） |
| スケジュール確認 | ❌ 未実装 | リンク存在するがページなし（404） |

### 管理者機能

| 機能 | 状態 | 詳細 |
|------|------|------|
| ダッシュボード | ✅ 完全実装 | 統計カード、最新登録、ランキング |
| ユーザー一覧/詳細 | ✅ 完全実装 | テーブル表示、詳細情報、ステータス管理 |
| ユーザー停止/削除 | ✅ 完全実装 | active/suspended/deleted切替、確認ダイアログ |
| コイン個別付与 | ✅ 完全実装 | ユーザー詳細ページ内のフォーム |
| コイン一括付与 | ✅ 完全実装 | 複数ユーザー選択、プリセット/カスタム金額 |
| コイン取引履歴 | ✅ 完全実装 | 管理用フィルタ付き取引一覧 |
| 期限切れ管理 | ✅ 完全実装 | 期限切れ間近のコイン表示、一括延長 |
| メンター一覧/詳細 | ✅ 完全実装 | カード表示、ティア設定、シフト表示 |
| メンター追加 | ✅ 完全実装 | 新規登録フォーム（アカウント自動作成含む） |
| メンター無効化/削除 | ✅ 完全実装 | 有効/無効切替、削除（ロール降格） |
| シフト管理 | ✅ 完全実装 | 週間カレンダー表示、シフト追加 |
| 固定予約管理 | ✅ 完全実装 | 作成/一覧/月次実行/カウントダウン/トリガーステータス |
| 分析ダッシュボード | ✅ 完全実装 | 予約/ユーザー/コイン推移チャート、メンター実績テーブル |
| システム設定 | ✅ 完全実装 | コイン単価、予約設定、チェックインボーナス等 |
| 営業時間設定 | ✅ 完全実装 | 曜日別営業時間、休館日管理 |
| 権限設定 | ✅ 完全実装 | メンターティア別の権限管理 |
| デザイン設定 | ✅ 完全実装 | テーマモード/アクセントカラー/フォントサイズ |
| ジム情報設定 | ✅ 完全実装 | ジム名、住所、電話等 |
| コイン付与プリセット設定 | ✅ 完全実装 | プリセットCRUD、動的読込 |
| トリガー/カウントダウン設定 | ✅ 完全実装 | 次回反映日カウントダウン、トリガーステータス |

### コインシステム

| 機能 | 状態 | 詳細 |
|------|------|------|
| プラン購入によるコイン付与 | 🔶 部分実装 | DB型定義あり（SubscriptionPlan, UserSubscription, Squareフィールド）。**決済フロー/Square連携は未実装** |
| 管理者による手動付与 | ✅ 完全実装 | 個別付与/一括付与/プリセット管理 |
| 来店ポイント付与 | ✅ 完全実装 | チェックイン時自動付与（設定値: デフォルト100SC、90日期限） |
| Fitest合格報酬 | ❌ 未実装 | 合否判定は実装済みだが自動コイン付与なし |
| 目標達成報酬 | ❌ 未実装 | 目標設定/追跡システム自体が存在しない |
| 紹介報酬 | ⬜ プレースホルダーのみ | DB型に`referral_code`/`referral_reward`あり。ロジックなし |
| キャンペーン/ボーナス付与 | ❌ 未実装 | キャンペーン管理システムなし（手動付与のみ） |
| 有効期限管理 | ✅ 完全実装 | `expires_at`追跡、期限切れ表示、一括延長 |
| FIFO消費 | ✅ 完全実装 | 予約時に`expires_at ASC, granted_at ASC`順でロック |

### 通知機能

| 機能 | 状態 | 詳細 |
|------|------|------|
| LINE通知送信 | ✅ 完全実装 | LINE Bot API経由。Flexメッセージテンプレート |
| 予約確認通知 | ✅ 完全実装 | 予約作成時にLINE通知送信 |
| キャンセル通知 | ✅ 完全実装 | キャンセル時にLINE通知送信 |
| メール送信 | ❌ 未実装 | メールサービス統合なし（Supabase認証メールのみ） |
| 予約リマインダー | ❌ 未実装 | スケジュール/Cronジョブなし |
| 月次レポート通知 | 🔶 部分実装 | 送信関数は実装済み。自動送信トリガーなし |
| 通知設定の保存 | ❌ 未実装 | UIスイッチはあるがDB保存なし |

---

## 6. 今後の拡張計画との照合

### コイン付与の多様化（計画①）

| 付与方法 | 現在の実装状況 | 必要な作業 |
|---------|---------------|-----------|
| プラン購入 | 🔶 **部分実装** | DB型・テーブルあり。Square API連携、決済フロー、Webhook受信が必要 |
| 管理者手動付与 | ✅ **完全実装** | 個別/一括/プリセット管理含む |
| 来店ポイント | ✅ **完全実装** | チェックイン時自動付与。金額は設定可能 |
| 目標達成報酬 | ❌ **未実装** | 目標システムの設計・実装が必要（DB/API/UI全て） |
| Fitest合格報酬 | ❌ **未実装** | Fitest記録APIに報酬ロジック追加が必要。インフラは整備済み |
| 紹介報酬 | ⬜ **スキーマのみ** | 紹介コード生成、追跡、報酬付与の全フロー実装が必要 |
| キャンペーン | ❌ **未実装** | キャンペーン管理UI、対象選定、自動付与の設計・実装が必要 |

### 自動化・Cronジョブ（計画②）

| 自動化項目 | 現在の状況 | 必要な作業 |
|-----------|-----------|-----------|
| 固定予約の月次実行 | ✅ **完全実装** | 手動トリガー。将来的にCron化可能 |
| コイン自動期限切れ | 🔶 **部分実装** | 期限切れ検出/延長は実装済み。自動失効処理なし |
| 予約リマインダー送信 | ❌ **未実装** | Cronジョブ＋LINE送信の実装が必要 |
| 月次レポート自動送信 | 🔶 **部分実装** | LINE送信関数あり。トリガーなし |

### 決済連携（計画③）

| 項目 | 現在の状況 | 必要な作業 |
|------|-----------|-----------|
| Square API連携 | ❌ **未実装** | Square SDK導入、API設定が必要 |
| サブスクリプション管理 | ⬜ **スキーマのみ** | `square_subscription_id`等のフィールドあり。連携ロジックなし |
| 決済Webhook受信 | ❌ **未実装** | 決済完了→コイン付与のフロー実装が必要 |
| プラン選択UI | ❌ **未実装** | ユーザー向け料金プラン表示・選択UIが必要 |

---

## 7. 総合サマリー

### 実装統計

| カテゴリ | 完全実装 | 部分実装 | プレースホルダー | 未実装 | 合計 |
|---------|---------|---------|----------------|--------|------|
| ユーザー機能 | 11 | 0 | 2 | 1 | 14 |
| メンター機能 | 5 | 0 | 0 | 2 | 7 |
| 管理者機能 | 19 | 0 | 0 | 0 | 19 |
| コインシステム | 4 | 1 | 1 | 3 | 9 |
| 通知機能 | 3 | 1 | 0 | 3 | 7 |
| **合計** | **42** | **2** | **3** | **9** | **56** |

### 実装率

- **完全実装率: 75%**（42/56機能）
- **何らかの実装あり: 84%**（47/56機能）

### コードベース健全性

| 指標 | 値 | 評価 |
|------|-----|------|
| 総ページ数 | 34 | ✅ |
| 総APIエンドポイント | 31 | ✅ |
| 404リンク | 2件 | ⚠️ `/mentor/customers`, `/mentor/schedule` |
| ゴーストAPI | 0件 | ✅ |
| 未使用コンポーネント | 4件 | ✅ 低リスク |
| 壊れたインポート | 0件 | ✅ |
| 型未定義テーブル | 3件 | ⚠️ `training_sessions`, `business_closures`, `system_settings` |

### 優先実装推奨（短期）

1. **`/mentor/customers`・`/mentor/schedule` ページ作成** - 既存リンクが404になっている
2. **プロフィール編集機能** - ユーザーが自分の情報を変更できない
3. **パスワード変更機能** - 基本的なセキュリティ機能
4. **通知設定の保存** - UIは存在するが保存されない
5. **Fitest合格報酬の自動付与** - インフラは整備済みで追加コスト低い

### 優先実装推奨（中期）

6. **コイン自動期限切れ処理** - Cronジョブまたはdb trigger
7. **予約リマインダー** - Cronジョブ＋LINE通知
8. **月次レポート自動送信** - 関数は実装済み、トリガーのみ必要
9. **紹介報酬システム** - DBスキーマは準備済み

### 優先実装推奨（長期）

10. **Square決済連携** - サブスクリプション購入フロー
11. **キャンペーン管理システム** - 自動化されたプロモーション
12. **目標達成報酬システム** - フルスクラッチ実装が必要
