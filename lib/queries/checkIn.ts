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
  codeId?: string
): Promise<{ success: boolean; bonusCoins: number; message: string }> {
  const supabase = createAdminClient()

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
      throw new Error('チェックインログの作成に失敗しました')
    }

    // コードを使用済みにする
    if (codeId) {
      await supabase
        .from('verification_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', codeId)
    }

    // 予約ステータスを更新
    if (reservationId) {
      await supabase
        .from('reservations')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
    }

    // 来店ポイントを付与
    if (bonusCoins > 0) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 90)

      // コイン台帳に追加
      const { data: ledger } = await supabase
        .from('coin_ledgers')
        .insert({
          user_id: userId,
          amount_initial: bonusCoins,
          amount_current: bonusCoins,
          amount_locked: 0,
          expires_at: expiresAt.toISOString(),
          description: '来店ポイント'
        })
        .select()
        .single()

      // 残高計算
      const { data: ledgers } = await supabase
        .from('coin_ledgers')
        .select('amount_current')
        .eq('user_id', userId)
        .eq('status', 'active')

      const totalBalance = ledgers?.reduce((sum, l) => sum + l.amount_current, 0) || bonusCoins

      // 取引履歴に記録
      await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          amount: bonusCoins,
          balance_after: totalBalance,
          type: 'bonus',
          description: '来店ポイント',
          ledger_id: ledger?.id
        })

      // 来店回数を更新
      const { error: rpcError } = await supabase.rpc('increment_visit_count', { p_user_id: userId })
      if (rpcError) {
        // RPCが存在しない場合はprofilesのtotal_visitsを+1
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_visits')
          .eq('id', userId)
          .single()
        await supabase
          .from('profiles')
          .update({
            total_visits: (profile?.total_visits || 0) + 1,
            last_visit_at: new Date().toISOString()
          })
          .eq('id', userId)
      }
    }

    return {
      success: true,
      bonusCoins,
      message: `チェックイン完了！${bonusCoins} SCを付与しました`
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
