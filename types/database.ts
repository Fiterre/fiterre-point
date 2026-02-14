// ========================================
// ENUM Types
// ========================================

export type UserRole = 'admin' | 'manager' | 'trainer' | 'user'
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

export interface Trainer {
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
  trainer_id: string
  reserved_date: string
  start_time: string
  end_time: string
  status: ReservationStatus
  locked_coin_amount: number
  cancel_deadline: string
  cancelled_at: string | null
  completed_at: string | null
  check_in_at: string | null
  user_notes: string | null
  trainer_notes: string | null
  created_at: string
  updated_at: string
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
