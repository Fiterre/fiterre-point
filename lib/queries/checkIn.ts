import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { VerificationCode, CheckInLogWithRelations } from '@/types/database'
import { getSetting } from './settings'

// 6桁のランダムコードを生成
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function createVerificationCode(
  userId: string,
  reservationId?: string
): Promise<VerificationCode | null> {
  const supabase = createAdminClient()

  // 有効期限（デフォルト24時間）
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  // 既存の未使用コードを無効化
  await supabase
    .from('verification_codes')
    .delete()
    .eq('user_id', userId)
    .is('used_at', null)

  // 新しいコードを生成
  const code = generateCode()

  const { data, error } = await supabase
    .from('verification_codes')
    .insert({
      user_id: userId,
      reservation_id: reservationId || null,
      code,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating verification code:', error)
    return null
  }

  return data as VerificationCode
}

export async function verifyCode(code: string): Promise<{
  valid: boolean
  userId?: string
  reservationId?: string
  codeId?: string
  message: string
}> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('verification_codes')
    .select('*')
    .eq('code', code)
    .is('used_at', null)
    .single()

  if (error || !data) {
    return { valid: false, message: 'コードが見つかりません' }
  }

  // 有効期限チェック
  if (new Date(data.expires_at) < new Date()) {
    return { valid: false, message: 'コードの有効期限が切れています' }
  }

  return {
    valid: true,
    userId: data.user_id,
    reservationId: data.reservation_id,
    codeId: data.id,
    message: 'コードが有効です'
  }
}

export async function checkIn(
  userId: string,
  verifiedBy: string,
  method: 'code' | 'qr' | 'manual',
  reservationId?: string,
  codeId?: string,
  grantBonus: boolean = true
): Promise<{ success: boolean; bonusCoins: number; message: string }> {
  const supabase = createAdminClient()

  // 冪等性チェック: 同一予約の二重チェックイン防止
  if (reservationId) {
    const { data: existingCheckIn } = await supabase
      .from('check_in_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('reservation_id', reservationId)
      .limit(1)

    if (existingCheckIn && existingCheckIn.length > 0) {
      return {
        success: false,
        bonusCoins: 0,
        message: 'この予約は既にチェックイン済みです'
      }
    }
  }

  // 同一ユーザーの当日チェックイン重複防止（予約なしの場合）
  if (!reservationId) {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { data: todayCheckIn } = await supabase
      .from('check_in_logs')
      .select('id')
      .eq('user_id', userId)
      .is('reservation_id', null)
      .gte('check_in_at', todayStart.toISOString())
      .limit(1)

    if (todayCheckIn && todayCheckIn.length > 0) {
      return {
        success: false,
        bonusCoins: 0,
        message: '本日は既にチェックイン済みです'
      }
    }
  }

  // 来店ポイントを取得
  const bonusCoins = await getSetting('checkin_bonus_coins') || 100

  try {
    // チェックインログを作成
    const { error: logError } = await supabase
      .from('check_in_logs')
      .insert({
        user_id: userId,
        reservation_id: reservationId || null,
        verification_code_id: codeId || null,
        method,
        verified_by: verifiedBy,
        bonus_coins_granted: bonusCoins
      })
      .select()
      .single()

    if (logError) {
      // UNIQUE制約違反 = 同時リクエストによる二重チェックイン
      if (logError.code === '23505') {
        return {
          success: false,
          bonusCoins: 0,
          message: 'この予約は既にチェックイン済みです'
        }
      }
      throw new Error('チェックインログの作成に失敗しました')
    }

    // コードを使用済みにする
    if (codeId) {
      const { error: codeError } = await supabase
        .from('verification_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', codeId)

      if (codeError) {
        console.error('Error marking code as used:', codeError)
      }
    }

    // 予約ステータスを更新
    if (reservationId) {
      const { error: reservationError } = await supabase
        .from('reservations')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)

      if (reservationError) {
        console.error('Error updating reservation status:', reservationError)
      }
    }

    // 来店ポイントを付与（顧客のみ。管理者・メンターはスキップ）
    if (bonusCoins > 0 && grantBonus) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 90)

      // コイン台帳に追加
      const { data: ledger, error: ledgerError } = await supabase
        .from('coin_ledgers')
        .insert({
          user_id: userId,
          amount_initial: bonusCoins,
          amount_current: bonusCoins,
          amount_locked: 0,
          expires_at: expiresAt.toISOString(),
          source_type: 'bonus',
        })
        .select()
        .single()

      if (ledgerError || !ledger) {
        throw new Error('コイン台帳への追加に失敗しました')
      }

      // 残高計算（期限切れコインを除外）
      const nowISO = new Date().toISOString()
      const { data: ledgers } = await supabase
        .from('coin_ledgers')
        .select('amount_current')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('expires_at', nowISO)

      const totalBalance = ledgers?.reduce((sum, l) => sum + l.amount_current, 0) || bonusCoins

      // 取引履歴に記録
      const { error: txError } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: userId,
          amount: bonusCoins,
          balance_after: totalBalance,
          type: 'bonus',
          description: '来店ポイント',
          ledger_id: ledger?.id,
          executed_by: verifiedBy,
        })

      if (txError) {
        console.error('Error recording bonus transaction:', txError)
      }

      // 来店回数を更新
      const { error: rpcError } = await supabase.rpc('increment_visit_count', { p_user_id: userId })
      if (rpcError) {
        // RPCが存在しない場合はprofilesのtotal_visitsを+1
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_visits')
          .eq('id', userId)
          .single()
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            total_visits: (profile?.total_visits || 0) + 1,
            last_visit_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (profileError) {
          console.error('Error updating visit count:', profileError)
        }
      }
    }

    return {
      success: true,
      bonusCoins: grantBonus ? bonusCoins : 0,
      message: grantBonus
        ? `チェックイン完了！${bonusCoins} SCを付与しました`
        : 'チェックイン完了'
    }
  } catch (error) {
    console.error('Check-in error:', error)
    return {
      success: false,
      bonusCoins: 0,
      message: error instanceof Error ? error.message : 'チェックインに失敗しました'
    }
  }
}

export async function getUserCheckIns(userId: string, limit: number = 20): Promise<CheckInLogWithRelations[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('check_in_logs')
    .select(`
      *,
      verifier:verified_by (
        display_name
      )
    `)
    .eq('user_id', userId)
    .order('check_in_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching check-ins:', error)
    return []
  }

  return (data ?? []) as unknown as CheckInLogWithRelations[]
}

export async function getRecentCheckIns(limit: number = 20): Promise<CheckInLogWithRelations[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('check_in_logs')
    .select(`
      *,
      profiles:user_id (
        display_name,
        email
      ),
      verifier:verified_by (
        display_name
      )
    `)
    .order('check_in_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent check-ins:', error)
    return []
  }

  return (data ?? []) as unknown as CheckInLogWithRelations[]
}

export async function getTodayCheckInCount(): Promise<number> {
  const supabase = createAdminClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('check_in_logs')
    .select('*', { count: 'exact', head: true })
    .gte('check_in_at', today.toISOString())

  if (error) {
    return 0
  }

  return count || 0
}
