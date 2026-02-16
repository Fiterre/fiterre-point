import { createAdminClient } from '@/lib/supabase/admin'
import { getSetting } from './settings'

export interface CancellationResult {
  success: boolean
  refundedAmount: number
  forfeitedAmount: number
  message: string
}

export async function canCancelReservation(reservationId: string, userId: string): Promise<{
  canCancel: boolean
  isWithinDeadline: boolean
  reason?: string
}> {
  const supabase = createAdminClient()

  // 予約情報を取得
  const { data: reservation, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', reservationId)
    .eq('user_id', userId)
    .single()

  if (error || !reservation) {
    return { canCancel: false, isWithinDeadline: false, reason: '予約が見つかりません' }
  }

  // 既にキャンセル済みまたは完了済み
  if (reservation.status === 'cancelled' || reservation.status === 'completed') {
    return { canCancel: false, isWithinDeadline: false, reason: 'この予約は既にキャンセルまたは完了しています' }
  }

  // キャンセル期限を取得（デフォルト24時間）
  const cancelDeadlineHours = await getSetting('cancel_deadline_hours') || 24

  // 予約日時
  const reservedAt = new Date(reservation.reserved_at)
  const now = new Date()
  const hoursUntilReservation = (reservedAt.getTime() - now.getTime()) / (1000 * 60 * 60)

  // 過去の予約
  if (hoursUntilReservation < 0) {
    return { canCancel: false, isWithinDeadline: false, reason: '過去の予約はキャンセルできません' }
  }

  // 期限内かどうか
  const isWithinDeadline = hoursUntilReservation >= cancelDeadlineHours

  return { canCancel: true, isWithinDeadline }
}

export async function cancelReservation(
  reservationId: string,
  userId: string,
  reason?: string
): Promise<CancellationResult> {
  const supabase = createAdminClient()

  // キャンセル可否チェック
  const { canCancel, isWithinDeadline, reason: checkReason } = await canCancelReservation(reservationId, userId)

  if (!canCancel) {
    return {
      success: false,
      refundedAmount: 0,
      forfeitedAmount: 0,
      message: checkReason || 'キャンセルできません'
    }
  }

  // 予約情報を取得
  const { data: reservation } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', reservationId)
    .single()

  if (!reservation) {
    return {
      success: false,
      refundedAmount: 0,
      forfeitedAmount: 0,
      message: '予約が見つかりません'
    }
  }

  const coinsUsed = reservation.coins_used || 0
  let refundedAmount = 0
  let forfeitedAmount = 0

  if (isWithinDeadline) {
    // 期限内: 100%返還
    refundedAmount = coinsUsed
    forfeitedAmount = 0
  } else {
    // 期限後: 100%没収
    refundedAmount = 0
    forfeitedAmount = coinsUsed
  }

  try {
    // 1. 予約ステータスを更新
    await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId)

    // 2. training_sessionのステータスも更新
    if (reservation.session_id) {
      await supabase
        .from('training_sessions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', reservation.session_id)
    }

    // 3. コインの処理
    if (refundedAmount > 0) {
      // コインを返還（ロックを解除）
      const { data: ledgers } = await supabase
        .from('coin_ledgers')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('amount_locked', 0)
        .order('expires_at', { ascending: true })

      let remainingToUnlock = refundedAmount

      for (const ledger of ledgers || []) {
        if (remainingToUnlock <= 0) break

        const unlockAmount = Math.min(ledger.amount_locked, remainingToUnlock)

        await supabase
          .from('coin_ledgers')
          .update({
            amount_current: ledger.amount_current + unlockAmount,
            amount_locked: ledger.amount_locked - unlockAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', ledger.id)

        remainingToUnlock -= unlockAmount
      }

      // 残高計算
      const { data: newLedgers } = await supabase
        .from('coin_ledgers')
        .select('amount_current')
        .eq('user_id', userId)
        .eq('status', 'active')

      const newBalance = newLedgers?.reduce((sum, l) => sum + l.amount_current, 0) || 0

      // 取引履歴に返還を記録
      await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          amount: refundedAmount,
          balance_after: newBalance,
          type: 'reservation_cancel',
          description: `予約キャンセル（返還）${reason ? `: ${reason}` : ''}`,
          reservation_id: reservationId
        })
    } else if (forfeitedAmount > 0) {
      // コインを没収（ロックを消滅させる）
      const { data: ledgers } = await supabase
        .from('coin_ledgers')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('amount_locked', 0)
        .order('expires_at', { ascending: true })

      let remainingToForfeit = forfeitedAmount

      for (const ledger of ledgers || []) {
        if (remainingToForfeit <= 0) break

        const forfeitAmount = Math.min(ledger.amount_locked, remainingToForfeit)

        await supabase
          .from('coin_ledgers')
          .update({
            amount_locked: ledger.amount_locked - forfeitAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', ledger.id)

        remainingToForfeit -= forfeitAmount
      }

      // 残高計算
      const { data: newLedgers } = await supabase
        .from('coin_ledgers')
        .select('amount_current')
        .eq('user_id', userId)
        .eq('status', 'active')

      const newBalance = newLedgers?.reduce((sum, l) => sum + l.amount_current, 0) || 0

      // 取引履歴に没収を記録
      await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          amount: -forfeitedAmount,
          balance_after: newBalance,
          type: 'reservation_cancel',
          description: `予約キャンセル（期限後没収）${reason ? `: ${reason}` : ''}`,
          reservation_id: reservationId
        })
    }

    // 4. キャンセル回数を記録（将来の警告機能用）
    try {
      await supabase.rpc('increment_cancel_count', { p_user_id: userId })
    } catch {
      // RPCが存在しない場合は無視
    }

    const message = isWithinDeadline
      ? `予約をキャンセルしました。${refundedAmount.toLocaleString()} SCを返還しました。`
      : `予約をキャンセルしました。キャンセル期限を過ぎていたため、${forfeitedAmount.toLocaleString()} SCは没収されました。`

    return {
      success: true,
      refundedAmount,
      forfeitedAmount,
      message
    }
  } catch (error) {
    console.error('Cancel reservation error:', error)
    return {
      success: false,
      refundedAmount: 0,
      forfeitedAmount: 0,
      message: 'キャンセル処理中にエラーが発生しました'
    }
  }
}
