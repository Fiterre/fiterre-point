import { createAdminClient } from '@/lib/supabase/admin'

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

  // 予約日時（JST基準で計算）
  // reserved_at は "2026-02-20T10:00:00" のような形式
  // サーバーのタイムゾーンに依存しないよう、明示的にJSTで計算
  const reservedAt = new Date(reservation.reserved_at)
  const now = new Date()

  // 過去の予約
  if (reservedAt.getTime() < now.getTime()) {
    return { canCancel: false, isWithinDeadline: false, reason: '過去の予約はキャンセルできません' }
  }

  // キャンセル期限: セッション前日の23:59 JST
  // 予約日の日付部分を取得（YYYY-MM-DD）
  const reservedDateStr = reservation.reserved_at.split('T')[0]
  const [year, month, day] = reservedDateStr.split('-').map(Number)
  // 前日23:59:59 JST = 前日14:59:59 UTC
  const deadlineUTC = new Date(Date.UTC(year, month - 1, day - 1, 23 - 9, 59, 59, 999))
  const isWithinDeadline = now <= deadlineUTC

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
        .from('coin_transactions')
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
        .from('coin_transactions')
        .insert({
          user_id: userId,
          amount: -forfeitedAmount,
          balance_after: newBalance,
          type: 'reservation_cancel',
          description: `予約キャンセル（期限後没収）${reason ? `: ${reason}` : ''}`,
          reservation_id: reservationId
        })
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

export async function getCancelStats(userId: string): Promise<{
  totalCancels: number
  monthCancels: number
  needsAttention: boolean
  suggestion: string | null
}> {
  const supabase = createAdminClient()

  // reservationsテーブルからキャンセル回数を直接カウント
  const { count: totalCancels } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'cancelled')

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { count: monthCancels } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'cancelled')
    .gte('updated_at', monthStart.toISOString())

  const total = totalCancels || 0
  const monthly = monthCancels || 0

  // 月3回以上、または累計10回以上でケア対象
  const needsAttention = monthly >= 3 || total >= 10

  let suggestion: string | null = null

  if (monthly >= 3) {
    suggestion = '最近キャンセルが多いようですね。お忙しい時期でしょうか？ご都合に合わせて、より柔軟なプランへの変更もご検討いただけます。お気軽にスタッフまでご相談ください。'
  } else if (total >= 10) {
    suggestion = 'いつもご利用ありがとうございます。スケジュール調整が難しい場合は、ショートセッションや、予約の取りやすい時間帯のご案内も可能です。'
  }

  return { totalCancels: total, monthCancels: monthly, needsAttention, suggestion }
}
