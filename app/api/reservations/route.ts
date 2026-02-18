import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // ユーザー認証
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // リクエストボディ
    const { sessionTypeId, mentorId, date, startTime } = await request.json()

    if (!sessionTypeId || !mentorId || !date || !startTime) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
    }

    // 日付の有効性チェック（サーバーサイド検証）
    const reservationDate = new Date(`${date}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrowCheck = new Date(today)
    tomorrowCheck.setDate(tomorrowCheck.getDate() + 1)

    if (reservationDate < tomorrowCheck) {
      return NextResponse.json({ error: '明日以降の日付を選択してください' }, { status: 400 })
    }

    // 28日ルール: maxDate検証
    const nowForRule = new Date()
    const maxAllowedDate = nowForRule.getDate() >= 28
      ? new Date(nowForRule.getFullYear(), nowForRule.getMonth() + 2, 0) // 翌月末
      : new Date(nowForRule.getFullYear(), nowForRule.getMonth() + 1, 0) // 今月末
    maxAllowedDate.setHours(23, 59, 59, 999)

    if (reservationDate > maxAllowedDate) {
      const maxStr = `${maxAllowedDate.getFullYear()}/${maxAllowedDate.getMonth() + 1}/${maxAllowedDate.getDate()}`
      return NextResponse.json({
        error: `${maxStr} までの予約が可能です`
      }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // セッション種別を取得
    const { data: sessionType, error: sessionError } = await adminClient
      .from('session_types')
      .select('*')
      .eq('id', sessionTypeId)
      .single()

    if (sessionError || !sessionType) {
      return NextResponse.json({ error: 'セッション種別が見つかりません' }, { status: 400 })
    }

    // メンター確認
    const { data: mentor, error: mentorError } = await adminClient
      .from('mentors')
      .select('*')
      .eq('id', mentorId)
      .eq('is_active', true)
      .single()

    if (mentorError || !mentor) {
      return NextResponse.json({ error: 'メンターが見つかりません' }, { status: 400 })
    }

    // ブロック枠チェック
    const reservedAtCheck = `${date}T${startTime}:00`
    const { data: blockedSlots } = await adminClient
      .from('reservations')
      .select('id')
      .eq('is_blocked', true)
      .or(`reserved_at.eq.${reservedAtCheck},is_all_day_block.eq.true`)

    const allDayBlocks = await adminClient
      .from('reservations')
      .select('id')
      .eq('is_blocked', true)
      .eq('is_all_day_block', true)
      .gte('reserved_at', `${date}T00:00:00`)
      .lt('reserved_at', `${date}T23:59:59`)

    if ((blockedSlots && blockedSlots.length > 0) || (allDayBlocks.data && allDayBlocks.data.length > 0)) {
      return NextResponse.json({ error: 'この時間帯は予約できません' }, { status: 400 })
    }

    // 残高確認
    const { data: ledgers } = await adminClient
      .from('coin_ledgers')
      .select('amount_current')
      .eq('user_id', user.id)
      .eq('status', 'active')

    const availableBalance = ledgers?.reduce((sum, l) => sum + l.amount_current, 0) ?? 0

    if (availableBalance < sessionType.coin_cost) {
      return NextResponse.json({
        error: `コインが不足しています（必要: ${sessionType.coin_cost} SC, 残高: ${availableBalance} SC）`
      }, { status: 400 })
    }

    // 1. training_sessionsレコードを作成
    const { data: trainingSession, error: trainingSessionError } = await adminClient
      .from('training_sessions')
      .insert({
        mentor_id: mentorId,
        session_type_id: sessionTypeId,
        scheduled_at: `${date}T${startTime}:00`,
        duration_minutes: sessionType.duration_minutes,
        status: 'scheduled',
      })
      .select()
      .single()

    if (trainingSessionError || !trainingSession) {
      console.error('Training session creation error:', trainingSessionError)
      return NextResponse.json({ error: 'セッション枠の作成に失敗しました' }, { status: 500 })
    }

    // 2. 予約作成（training_sessionのIDを関連付け）
    const reservedAtTimestamp = `${date}T${startTime}:00`

    const { data: reservation, error: reservationError } = await adminClient
      .from('reservations')
      .insert({
        user_id: user.id,
        mentor_id: mentorId,
        session_id: trainingSession.id,
        coins_used: sessionType.coin_cost,
        reserved_at: reservedAtTimestamp,
        status: 'pending',
      })
      .select()
      .single()

    if (reservationError) {
      console.error('Reservation error:', reservationError)
      // エラーが発生したら作成したtraining_sessionを削除
      await adminClient.from('training_sessions').delete().eq('id', trainingSession.id)
      return NextResponse.json({ error: '予約の作成に失敗しました' }, { status: 500 })
    }

    // コインをロック（FIFO順）
    let remainingToLock = sessionType.coin_cost

    const { data: activeLedgers } = await adminClient
      .from('coin_ledgers')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('amount_current', 0)
      .order('expires_at', { ascending: true })
      .order('granted_at', { ascending: true })

    for (const ledger of activeLedgers || []) {
      if (remainingToLock <= 0) break

      const lockAmount = Math.min(ledger.amount_current, remainingToLock)

      await adminClient
        .from('coin_ledgers')
        .update({
          amount_current: ledger.amount_current - lockAmount,
          amount_locked: ledger.amount_locked + lockAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ledger.id)

      remainingToLock -= lockAmount
    }

    // 残高再計算
    const { data: newLedgers } = await adminClient
      .from('coin_ledgers')
      .select('amount_current, amount_locked')
      .eq('user_id', user.id)
      .eq('status', 'active')

    const newBalance = newLedgers?.reduce((sum, l) => sum + l.amount_current, 0) ?? 0

    // 取引履歴に記録
    await adminClient
      .from('coin_transactions')
      .insert({
        user_id: user.id,
        amount: -sessionType.coin_cost,
        balance_after: newBalance,
        type: 'reservation_lock',
        description: `予約ロック: ${date} ${startTime}〜`,
        reservation_id: reservation.id,
      })

    return NextResponse.json({
      success: true,
      reservationId: reservation.id,
      lockedAmount: sessionType.coin_cost,
      remainingBalance: newBalance,
    })
  } catch (error) {
    console.error('Reservation API error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
