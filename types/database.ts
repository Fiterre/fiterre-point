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
  specialty: string | null
  bio: string | null
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
  created_at: string | null
  updated_at: string | null
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
