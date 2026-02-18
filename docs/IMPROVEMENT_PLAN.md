# Stella Coin 改修計画

## 分析日時
2026-02-18

---

## 📊 分析結果サマリー

### ページ構成（36ページ）

| ロール | パス数 | 主な画面 |
|--------|--------|---------|
| 顧客 (dashboard) | 12 | ダッシュボード・予約・Fitest・履歴・記録・設定 |
| メンター (mentor) | 7 | ホーム・顧客管理・予約・Fitest入力・記録・シフト |
| 管理者 (admin) | 15 | ユーザー・メンター・シフト・予約・固定予約・設定・分析・コイン |
| 認証 | 2 | ログイン・新規登録 |

### API構成（34エンドポイント）

| カテゴリ | エンドポイント数 |
|----------|----------------|
| admin/* | 16 |
| reservations | 3 |
| mentors/available | 1 |
| mentor/* | 2 |
| user/* | 6 |
| auth/* | 3 |
| checkin/* | 2 |
| line/* | 1 |

---

## 🔴 報告された問題と調査結果

### 管理者画面

#### 1. ダークモードで権限内容が見えない
- **該当ファイル**: [components/features/admin/settings/PermissionsForm.tsx](../components/features/admin/settings/PermissionsForm.tsx#L156)
- **問題箇所**: L156 `className="bg-white p-3 rounded-lg border"`
  - ダーク背景の `.bg-muted` コンテナ内で `bg-white` を直書きしている
  - ダークモード時: 白背景 + ダーク文字 → テキストが見えない
- **影響範囲**: 各権限カテゴリカード（全Tier展開時に発生）
- **対応**: `bg-white` → `bg-card` または `bg-background` に変更、テキストも `text-foreground` 確認

#### 2. トリガーの一元管理
- **現状**: 設定画面に「自動処理（Triggers）」タブは既に存在
  - [app/(dashboard)/admin/settings/page.tsx](../app/(dashboard)/admin/settings/page.tsx#L8) で `TriggerSettingsTab` を読み込み済み
  - 固定予約の管理は `/admin/recurring/` に分散
- **問題**: トリガー設定タブの内容と `/admin/recurring/` ページが分離している
- **対応**: TriggerSettingsTab内に固定予約一覧も統合表示する

#### 3. Fitestの柔軟な設定
- **現状**: テスト項目が完全にハードコード
  - `fitest_results` テーブル: `memory_game_score`, `big3_total`, `weight_difference` の3項目のみ
  - `calculateTotalScore()` 関数でも3項目固定の計算ロジック
  - DB スキーマにテスト項目マスタテーブル（`fitest_items`）が存在しない
- **問題**: テスト項目の追加・編集・削除が不可能
- **対応**: Phase B で詳述

---

### 顧客画面

#### 1. シフト入力してもメンターが出ない（根本原因判明）

**現状の予約フローと問題点**:

```
予約フォーム (/dashboard/reservations/new)
  └─ セッション種別選択
  └─ 日付・時間入力
  └─ useEffect で fetchAvailableMentors() を呼出
       └─ GET /api/mentors/available?date=YYYY-MM-DD&time=HH:MM
            └─ mentor_shifts テーブルを検索
```

**API側の問題** ([app/api/mentors/available/route.ts](../app/api/mentors/available/route.ts#L34-L35)):
```typescript
.lte('start_time', time + ':00')   // 例: "09:00:00"
.gte('end_time', time + ':00')     // 例: "09:00:00"
```

**DBに登録されているシフトの `start_time`/`end_time` の形式が `HH:MM`（秒なし）の場合**、
`time + ':00'` で `"09:00:00"` と比較すると文字列比較で正しく動作しない可能性がある。
（PostgreSQLのtime型なら自動変換されるが、text型で格納している場合は不一致になる）

**追加の問題点**:
- `getMentors()` で全メンターを取得して `mentors` propに渡しているが、ReservationForm では `allMentors` として受け取り**一切使用していない**（L35, L42）
- 日付選択後、時間選択のUI が固定12時間分のみ（09:00〜20:00の整時のみ）
- メンターのシフトが実際に登録されているか確認が必要

**対応**:
- API の時刻比較ロジックの検証（DBのtime型カラムか確認）
- フォームに「対応可能なシフトがない」理由をデバッグ表示
- 不要な `allMentors` prop の削除

#### 2. 固定予約の表示
- **現状**: [app/(dashboard)/dashboard/reservations/page.tsx](../app/(dashboard)/dashboard/reservations/page.tsx) に固定予約の表示なし
  - 管理側 `recurring_reservations` テーブルは存在・活用されているが、顧客画面で非表示
- **対応**: 予約ページに「固定予約」セクションを追加し、自分の固定予約スケジュールを表示

#### 3. 3Dグレードカード
- **現状**: なし
- **対応**: Phase C で詳述

---

### 全体

#### 1. シフトに応じたメンター表示（再掲・詳細）

**データ構造**:
```
mentor_shifts
  ├─ mentor_id → mentors.id
  ├─ day_of_week (0=日〜6=土)
  ├─ start_time (time型)
  ├─ end_time   (time型)
  └─ is_active
```

**検索ロジック** ([lib/queries/shifts.ts:getAvailableMentors](../lib/queries/shifts.ts#L39-L74)):
- `day_of_week` + `start_time <= time` + `end_time >= time` で検索
- 問題: **API側 (`route.ts`) では `:00` を付加**しているが、`shifts.ts` の `getAvailableMentors()` では直接 `time` を渡している（2つの実装が混在）

#### 2. キャッシュクリア機能
- **現状**: Service Worker なし
- **対応**: Phase D で詳述

---

## 📋 改修フェーズ

### Phase A: バグ修正・UI改善（優先度: 最高）

- [ ] **A-1: 権限設定のダークモード対応**
  - `bg-white` → `bg-card`（ダークモード対応CSS変数）
  - テキストカラー確認（`text-gray-*` 直書きの排除）
  - 工数: 小（1ファイル、1〜3箇所）

- [ ] **A-2: シフト→メンター表示の修正**
  - DB の `mentor_shifts.start_time` / `end_time` の型確認
  - API の時刻比較ロジック検証（`:00` 付加の要否）
  - フォームの `allMentors` prop 不要参照を削除
  - 工数: 小〜中（2〜3ファイル）

- [ ] **A-3: 予約画面に固定予約セクション追加**
  - `getRecurringReservations()` または新規クエリで自分の固定予約取得
  - 予約ページに固定スケジュール表示カード追加
  - 工数: 中（1〜2ファイル）

### Phase B: Fitest再構築（優先度: 高）

- [ ] **B-1: `fitest_items` テーブル設計・作成**（DB変更）
- [ ] **B-2: `fitest_milestone_criteria` テーブル作成**（DB変更）
- [ ] **B-3: 管理画面でのFitest項目CRUD**
  - 設定画面に「Fitest設定」タブ追加
  - テスト項目の追加・編集・削除・並べ替え
- [ ] **B-4: Fitest実施フォームの動的化**
  - `FitestForm.tsx` のフィールドを `fitest_items` テーブルから動的生成
  - スコア計算ロジックを汎用化
- [ ] **B-5: `calculateTotalScore()`・`checkPassStatus()` の汎用化**

### Phase C: UIエンハンス（優先度: 中）

- [ ] **C-1: 3Dグレードカード実装**
  - 技術選定: CSS 3D Transform（軽量・依存少）または React Three Fiber
  - ランク別カラーリング（Bronze / Silver / Gold / Platinum / Diamond）
  - ドラッグ回転・自動回転アニメーション
  - ホログラフィック光沢エフェクト（CSS グラデーション）
  - 表示場所: ダッシュボードトップまたはFitestページ

- [ ] **C-2: トリガー管理の改善**
  - TriggerSettingsTab内に固定予約リストを統合
  - 実行ログの詳細表示（成功/スキップ/失敗の件数グラフ）

### Phase D: 全体改善（優先度: 中〜低）

- [ ] **D-1: キャッシュクリア機能**
  - Service Worker登録（next-pwa またはカスタム）
  - 管理者向けキャッシュクリアボタン
  - ユーザー向け「データ更新」ボタン（ブラウザキャッシュ無効化）

- [ ] **D-2: 予約フローの改善**
  - 時間選択の粒度改善（30分単位や実際の空き枠表示）
  - 選択した日時のシフト空き状況のビジュアル表示

---

## 🗃️ データベース変更案

### Phase B: Fitest再構築用

```sql
-- Fitestテスト項目マスタ
CREATE TABLE fitest_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,                    -- 例: "神経衰弱", "Big3合計", "体重予測精度"
    description TEXT,
    icon TEXT,                             -- アイコン名 (lucide-react)
    input_type TEXT NOT NULL CHECK (input_type IN ('score', 'weight', 'time', 'distance', 'count')),
    unit TEXT,                             -- 例: "点", "kg", "秒"
    scoring_method TEXT NOT NULL CHECK (scoring_method IN ('higher_better', 'lower_better', 'target_match')),
    max_score INTEGER DEFAULT 100,         -- スコア換算の上限
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fitestマイルストーンの項目別合格基準
CREATE TABLE fitest_milestone_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    milestone_id UUID REFERENCES fitest_milestones(id) ON DELETE CASCADE,
    item_id UUID REFERENCES fitest_items(id) ON DELETE CASCADE,
    min_value DECIMAL,                     -- 最低値（higher_better の場合）
    max_value DECIMAL,                     -- 最大値（lower_better の場合）
    target_value DECIMAL,                  -- 目標値（target_match の場合）
    score_weight INTEGER DEFAULT 100,      -- 総合スコアへの重み（%）
    UNIQUE(milestone_id, item_id)
);

-- Fitest結果の動的項目値
CREATE TABLE fitest_result_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id UUID REFERENCES fitest_results(id) ON DELETE CASCADE,
    item_id UUID REFERENCES fitest_items(id),
    raw_value DECIMAL NOT NULL,            -- 実測値
    converted_score DECIMAL,              -- 100点換算スコア
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(result_id, item_id)
);

-- 初期データ（既存3項目のマイグレーション）
INSERT INTO fitest_items (name, description, input_type, unit, scoring_method, max_score, display_order) VALUES
  ('神経衰弱', '脳トレーニング: 神経衰弱ゲームの得点', 'score', '点', 'higher_better', 100, 1),
  ('Big3合計', 'ベンチプレス + スクワット + デッドリフトの1RM合計', 'weight', 'kg', 'higher_better', 100, 2),
  ('体重予測精度', '予測体重と実測体重の誤差（少ないほど高得点）', 'weight', 'kg', 'lower_better', 100, 3);
```

---

## 🎨 3Dカード仕様（Phase C-1）

### 技術選定推奨: CSS 3D Transform

- **理由**: Three.js/R3F は bundle size が大きく（+600KB〜）、CSS 3D で同等の視覚効果が実現可能
- **代替**: `react-spring` + CSS 3D（インタラクション強化が必要な場合）

### デザイン仕様

```
カードサイズ: 340px × 200px（クレジットカード比率）
角丸: 16px
素材感: グラデーション + ノイズテクスチャ + グロス反射
```

**ランク別カラーリング**:

| ランク | メインカラー | グラデーション |
|--------|------------|--------------|
| Bronze | `#CD7F32` | `#8B4513` → `#CD7F32` → `#DAA520` |
| Silver | `#C0C0C0` | `#808080` → `#C0C0C0` → `#E8E8E8` |
| Gold | `#FFD700` | `#B8860B` → `#FFD700` → `#FFF176` |
| Platinum | `#E5E4E2` | `#9E9E9E` → `#E5E4E2` → `#FFFFFF` |
| Diamond | `#B9F2FF` | `#00BCD4` → `#B9F2FF` → `#FFFFFF` |

**対応するFitestLevel**:
```
beginner     → Bronze
intermediate → Silver
advanced     → Gold / Platinum
master       → Diamond
```

**アニメーション仕様**:
- 自動回転: Y軸 360° / 8秒 / linear（ホバーで停止）
- ドラッグ回転: マウス/タッチ追従（X/Y軸 ±30°範囲）
- ホログラフィック: `background-position` を mousemove で追従するグラデーション

---

## 🚦 推奨改修順序

```
優先度1 (即座に対応): A-1 → A-2 → A-3
  理由: 既存機能のバグ・視認性問題。ユーザー体験に直接影響

優先度2 (次スプリント): B-1 → B-2 → B-3 → B-4 → B-5
  理由: Fitest再構築はDB変更を伴うため、早期に着手すべき
  注意: B-1/B-2 のDB変更実施後、既存データのマイグレーションが必要

優先度3 (中期): C-1 → C-2
  理由: 視覚的改善・管理機能強化

優先度4 (長期): D-1 → D-2
  理由: インフラ・UX改善。他フェーズ完了後に実施
```

### A-1 の即時修正箇所

[components/features/admin/settings/PermissionsForm.tsx:156](../components/features/admin/settings/PermissionsForm.tsx#L156):
```tsx
// 修正前
<div key={category} className="bg-white p-3 rounded-lg border">

// 修正後
<div key={category} className="bg-card p-3 rounded-lg border">
```

同ファイル L147 のTierヘッダー内テキストも確認:
```tsx
// 修正前（暗黙的にダーク非対応の可能性）
<span className="text-sm text-muted-foreground">{tier.description}</span>

// これは text-muted-foreground でOK（CSS変数）
```

---

## 🔍 シフト→メンター表示の詳細フロー

```
1. ユーザーが日付 + 時間を入力
   └─ ReservationForm.tsx: useEffect([date, time]) 発火

2. fetchAvailableMentors() 実行
   └─ GET /api/mentors/available?date=2026-02-20&time=10:00

3. API処理 (app/api/mentors/available/route.ts)
   ├─ new Date(date).getDay() → 曜日計算
   │   ⚠️ 注意: new Date("2026-02-20") は UTC解釈でJSTと1日ずれる可能性
   │   → new Date(date + 'T00:00:00') で明示的にローカル時間にすべき
   │
   └─ mentor_shifts を検索
       .eq('day_of_week', dayOfWeek)
       .lte('start_time', time + ':00')   // "10:00:00"
       .gte('end_time', time + ':00')     // "10:00:00"
       ⚠️ DBのtime型なら "10:00" でも "10:00:00" でも比較可能
       ⚠️ ただし実際にシフトが登録されているかが前提

4. 結果をReservationFormに返却
   └─ availableMentors に格納 → メンター選択UIを表示

⚠️ 根本問題: シフトが登録されていない場合、何も表示されない
   → 管理者がシフトを正しく登録しているか確認が最初のデバッグステップ
```

---

## 📁 主要ファイルマップ

| 機能 | ファイル |
|------|---------|
| 権限設定フォーム | [components/features/admin/settings/PermissionsForm.tsx](../components/features/admin/settings/PermissionsForm.tsx) |
| 予約フォーム | [components/features/reservations/ReservationForm.tsx](../components/features/reservations/ReservationForm.tsx) |
| メンター取得API | [app/api/mentors/available/route.ts](../app/api/mentors/available/route.ts) |
| シフトクエリ | [lib/queries/shifts.ts](../lib/queries/shifts.ts) |
| Fitestクエリ | [lib/queries/fitest.ts](../lib/queries/fitest.ts) |
| Fitest型定義 | [types/database.ts:376](../types/database.ts#L376) |
| 予約ページ（顧客） | [app/(dashboard)/dashboard/reservations/page.tsx](../app/(dashboard)/dashboard/reservations/page.tsx) |
| 設定ページ（管理者） | [app/(dashboard)/admin/settings/page.tsx](../app/(dashboard)/admin/settings/page.tsx) |
