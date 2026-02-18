// ========================================
// ENUM Types
// ========================================

export type UserRole = 'admin' | 'manager' | 'mentor' | 'user'
export type AccountStatus = 'active' | 'locked' | 'suspended' | 'deleted'
export type MemberRank = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
export type LedgerStatus = 'active' | 'used_up' | 'expired' | 'locked'
export type TransactionType =
  | 'subscription_pay'
  | 'bonus'
  | 'spend'
  | 'reservation_lock'
  | 'reservation_confirm'
  | 'reservation_cancel'
  | 'expire'
  | 'admin_adjust'
  | 'migration'
  | 'undo'
  | 'referral_reward'
export type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

// ========================================
// Database Tables
// ========================================

export interface Profile {
  id: string
  email: string
  display_name: string | null
  phone: string | null
  line_user_id: string | null
  avatar_url: string | null
  square_customer_id: string | null
  status: AccountStatus
  rank: MemberRank
  lifetime_value_jpy: number
  referral_code: string | null
  total_visits: number
  last_visit_at: string | null
  created_at: string
  updated_at: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  price_jpy: number
  coin_amount: number
  bonus_rate: number
  square_plan_id: string | null
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface UserSubscription {
  id: string
  user_id: string
  plan_id: string
  square_subscription_id: string | null
  status: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export interface CoinLedger {
  id: string
  user_id: string
  amount_initial: number
  amount_current: number
  amount_locked: number
  granted_at: string
  last_used_at: string | null
  expires_at: string
  status: LedgerStatus
  source_type: TransactionType
  source_subscription_id: string | null
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  amount: number
  balance_after: number
  type: TransactionType
  description: string | null
  ledger_id: string | null
  reservation_id: string | null
  executed_by: string | null
  is_undone: boolean
  undone_at: string | null
  undone_by: string | null
  square_payment_id: string | null
  square_invoice_id: string | null
  created_at: string
}

export interface Mentor {
  id: string
  user_id: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Reservation {
  id: string
  user_id: string
  mentor_id: string | null
  session_id: string | null
  reserved_at: string | null
  coins_used: number
  status: ReservationStatus | null
  is_blocked: boolean
  is_all_day_block: boolean
  block_reason: string | null
  created_at: string | null
  updated_at: string | null
}

// トレーニングセッション
export type TrainingSessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

export interface TrainingSession {
  id: string
  mentor_id: string
  session_type_id: string
  scheduled_at: string
  duration_minutes: number
  status: TrainingSessionStatus
  created_at: string
  updated_at: string
}

// 臨時休業
export interface BusinessClosure {
  id: string
  closure_date: string
  reason: string | null
  created_by: string | null
  created_at: string
}

// ========================================
// View Types
// ========================================

export interface UserBalance {
  user_id: string
  display_name: string | null
  email: string
  status: AccountStatus
  rank: MemberRank
  available_balance: number
  locked_balance: number
  total_balance: number
  next_expiry_date: string | null
}

// ========================================
// API Response Types
// ========================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

// ========================================
// Extended Types (with Relations)
// ========================================

// セッション種別
export interface SessionType {
  id: string
  name: string
  duration_minutes: number
  coin_cost: number
  description: string | null
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

// メンター（拡張）
export interface MentorWithProfile extends Mentor {
  profiles: {
    display_name: string | null
  }
}

// 予約（拡張）
export interface ReservationWithDetails extends Reservation {
  mentors: {
    profiles: {
      display_name: string | null
    }
  }
  session_types: SessionType | null
}

// メンターシフト
export interface MentorShift {
  id: string
  mentor_id: string
  day_of_week: number  // 0=日曜, 1=月曜, ..., 6=土曜
  start_time: string
  end_time: string
  is_active: boolean
  effective_from: string
  effective_until: string | null
  created_at: string
  updated_at: string
}

// 固定予約（保証枠）
export interface RecurringReservation {
  id: string
  user_id: string
  mentor_id: string
  session_type_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
  priority: number
  notes: string | null
  created_at: string
  updated_at: string
}

// 固定予約の反映履歴
export interface RecurringReservationLog {
  id: string
  recurring_reservation_id: string
  reservation_id: string | null
  target_date: string
  status: 'created' | 'skipped' | 'failed'
  error_message: string | null
  created_at: string
}

// シフト拡張型（メンター情報付き）
export interface MentorShiftWithProfile extends MentorShift {
  mentors: {
    id: string
    profiles: {
      display_name: string | null
    }
  }
}

// 固定予約拡張型
export interface RecurringReservationWithDetails extends RecurringReservation {
  profiles: {
    display_name: string | null
    email: string
  }
  mentors: {
    profiles: {
      display_name: string | null
    }
  }
  session_types: {
    name: string
    coin_cost: number
  }
}

// ========================================
// 権限Tier
// ========================================

export interface RoleTier {
  id: string
  tier_level: number
  tier_name: string
  description: string | null
  permissions: TierPermissions
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TierPermissions {
  users: { view: boolean; edit: boolean; delete: boolean }
  coins: { view: boolean; grant: boolean; adjust: boolean }
  mentors: { view: boolean; edit: boolean; manage_all: boolean }
  shifts: { view: boolean; edit_own: boolean; edit_all: boolean }
  reservations: { view_all?: boolean; view_own?: boolean; edit_all?: boolean; edit_own?: boolean; cancel: boolean }
  recurring: { view: boolean; edit: boolean; execute: boolean }
  fitest: { view: boolean; input: boolean; manage: boolean }
  records: { view_all?: boolean; view_own?: boolean; edit_all?: boolean; edit_own?: boolean }
  settings: { view: boolean; edit: boolean }
  analytics: { view: boolean }
}

export interface UserRoleWithTier {
  id: string
  user_id: string
  role: 'admin' | 'manager' | 'mentor' | 'user'
  tier_id: string | null
  granted_by: string | null
  granted_at: string
  role_tiers: RoleTier | null
}

// ========================================
// トレーニングレコード
// ========================================

// エクササイズ詳細
export interface Exercise {
  name: string
  sets?: number
  reps?: number
  weight?: number
  duration?: number
  notes?: string
}

// トレーニングレコード
export interface TrainingRecord {
  id: string
  user_id: string
  mentor_id: string | null
  session_id: string | null
  record_date: string
  record_type: 'daily' | 'monthly'
  title: string | null
  content: string
  exercises: Exercise[]
  notes: string | null
  is_sent_to_line: boolean
  sent_at: string | null
  created_at: string
  updated_at: string
}

// トレーニングレコード（リレーション付き）
export interface TrainingRecordWithRelations extends TrainingRecord {
  profiles?: {
    display_name: string | null
    email: string
  }
  mentors?: {
    profiles: {
      display_name: string | null
    }
  }
}

// ========================================
// Fitest（フィットネス能力測定テスト）
// ========================================

// Fitestレベル
export type FitestLevel = 'beginner' | 'intermediate' | 'advanced' | 'master'

// Fitest結果
export interface FitestResult {
  id: string
  user_id: string
  mentor_id: string | null
  test_date: string
  current_level: FitestLevel
  target_level: FitestLevel

  // 神経衰弱トレーニング
  memory_game_score: number | null
  memory_game_accuracy: number | null
  memory_game_notes: string | null

  // Big3計測
  bench_press_1rm: number | null
  squat_1rm: number | null
  deadlift_1rm: number | null
  big3_total: number | null
  big3_notes: string | null

  // 体重予測
  weight_predicted: number | null
  weight_actual: number | null
  weight_difference: number | null
  weight_notes: string | null

  // 総合評価
  total_score: number | null
  passed: boolean
  overall_notes: string | null

  created_at: string
  updated_at: string
}

// Fitest結果（リレーション付き）
export interface FitestResultWithRelations extends FitestResult {
  profiles?: {
    display_name: string | null
    email: string
  }
  mentors?: {
    profiles: {
      display_name: string | null
    }
  }
}

// Fitestマイルストーン
export interface FitestMilestone {
  id: string
  from_level: FitestLevel
  to_level: FitestLevel
  min_memory_score: number | null
  min_big3_total: number | null
  max_weight_difference: number | null
  min_total_score: number | null
  reward_coins: number
  reward_description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// レベルラベル
export const FITEST_LEVEL_LABELS: Record<FitestLevel, string> = {
  beginner: '基礎',
  intermediate: '中級',
  advanced: '上級',
  master: 'マスター'
}

// Fitestテスト項目マスタ
export type FitestInputType = 'score' | 'weight' | 'time' | 'distance' | 'count'
export type FitestScoringMethod = 'higher_better' | 'lower_better' | 'target_match'

export interface FitestItem {
  id: string
  name: string
  description: string | null
  icon: string | null
  input_type: FitestInputType
  unit: string | null
  scoring_method: FitestScoringMethod
  max_score: number
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export const INPUT_TYPE_LABELS: Record<FitestInputType, string> = {
  score:    '得点',
  weight:   '重量 (kg)',
  time:     '時間 (秒)',
  distance: '距離 (m)',
  count:    '回数',
}

export const SCORING_METHOD_LABELS: Record<FitestScoringMethod, string> = {
  higher_better: '高いほど良い',
  lower_better:  '低いほど良い',
  target_match:  '目標値に近いほど良い',
}

// ========================================
// 入店認証・チェックイン
// ========================================

// 認証コード
export interface VerificationCode {
  id: string
  user_id: string
  reservation_id: string | null
  code: string
  expires_at: string
  used_at: string | null
  created_at: string
}

// チェックインログ
export interface CheckInLog {
  id: string
  user_id: string
  reservation_id: string | null
  verification_code_id: string | null
  method: 'code' | 'qr' | 'manual'
  verified_by: string | null
  bonus_coins_granted: number
  check_in_at: string
}

// チェックインログ（リレーション付き）
export interface CheckInLogWithRelations extends CheckInLog {
  profiles?: {
    display_name: string | null
    email: string
  }
  verifier?: {
    display_name: string | null
  }
}
