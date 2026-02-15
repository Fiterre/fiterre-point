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
    const { sessionTypeId, trainerId, date, startTime } = await request.json()

    if (!sessionTypeId || !trainerId || !date || !startTime) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
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

    // トレーナー確認
    const { data: trainer, error: trainerError } = await adminClient
      .from('trainers')
      .select('*')
      .eq('id', trainerId)
      .eq('is_active', true)
      .single()

    if (trainerError || !trainer) {
      return NextResponse.json({ error: 'トレーナーが見つかりません' }, { status: 400 })
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

    // 終了時間を計算
    const [hours, minutes] = startTime.split(':').map(Number)
    const startDate = new Date(2000, 0, 1, hours, minutes)
    const endDate = new Date(startDate)
    endDate.setMinutes(endDate.getMinutes() + sessionType.duration_minutes)
    const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`

    // 1. training_sessionsレコードを作成
    const { data: trainingSession, error: trainingSessionError } = await adminClient
      .from('training_sessions')
      .insert({
        trainer_id: trainerId,
        session_date: date,
        start_time: startTime,
        end_time: endTime,
        capacity: 1,
        is_available: false, // 予約されたので利用不可
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
        trainer_id: trainerId,
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
