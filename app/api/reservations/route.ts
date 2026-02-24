import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isValidDate, isValidTime, isValidUUID } from '@/lib/validation'
import { getSetting } from '@/lib/queries/settings'
import { revalidatePath } from 'next/cache'

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export async function POST(request: Request) {
  try {
    // ユーザー認証
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // ユーザーステータスチェック（suspended/locked は予約不可）
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single()

    if (profile && profile.status !== 'active') {
      return NextResponse.json({ error: 'アカウントが制限されています。管理者にお問い合わせください' }, { status: 403 })
    }

    // リクエストボディ（JSON解析エラーハンドリング付き）
    let body: { sessionTypeId?: string; mentorId?: string; date?: string; startTime?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: '無効なリクエスト形式です' }, { status: 400 })
    }
    const { sessionTypeId, mentorId, date, startTime } = body

    if (!sessionTypeId || !mentorId || !date || !startTime) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
    }

    // フォーマットバリデーション
    if (!isValidUUID(sessionTypeId) || !isValidUUID(mentorId)) {
      return NextResponse.json({ error: '無効なIDフォーマットです' }, { status: 400 })
    }
    if (!isValidDate(date)) {
      return NextResponse.json({ error: '無効な日付フォーマットです（YYYY-MM-DD）' }, { status: 400 })
    }
    if (!isValidTime(startTime)) {
      return NextResponse.json({ error: '無効な時刻フォーマットです（HH:MM）' }, { status: 400 })
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

    // ===== 営業時間・休業日・シフトのサーバーサイドバリデーション =====

    const dayOfWeek = new Date(`${date}T00:00:00`).getDay()
    const dayKey = DAY_KEYS[dayOfWeek]

    // 営業時間チェック
    const businessHours = await getSetting('business_hours') as Record<string, { open: string; close: string; is_open: boolean }> | null
    const dayHours = businessHours?.[dayKey]

    if (dayHours && !dayHours.is_open) {
      return NextResponse.json({ error: '定休日のため予約できません' }, { status: 400 })
    }

    if (dayHours && (startTime < dayHours.open || startTime >= dayHours.close)) {
      return NextResponse.json({ error: '営業時間外の時刻です' }, { status: 400 })
    }

    // 臨時休業日チェック
    const { data: closureCheck } = await adminClient
      .from('business_closures')
      .select('id')
      .eq('closure_date', date)
      .limit(1)

    if (closureCheck && closureCheck.length > 0) {
      return NextResponse.json({ error: '臨時休業日のため予約できません' }, { status: 400 })
    }

    // メンターのシフト在籍チェック
    const { data: shiftCheck } = await adminClient
      .from('mentor_shifts')
      .select('id')
      .eq('mentor_id', mentorId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .lte('start_time', startTime)
      .gt('end_time', startTime)
      .limit(1)

    if (!shiftCheck || shiftCheck.length === 0) {
      return NextResponse.json({ error: 'この時間帯にメンターのシフトがありません' }, { status: 400 })
    }

    const reservedAtCheck = `${date}T${startTime}:00`

    // セッション種別を取得
    const { data: sessionType, error: sessionError } = await adminClient
      .from('session_types')
      .select('*')
      .eq('id', sessionTypeId)
      .single()

    if (sessionError || !sessionType) {
      return NextResponse.json({ error: 'セッション種別が見つかりません' }, { status: 400 })
    }

    if (!sessionType.coin_cost || sessionType.coin_cost <= 0) {
      return NextResponse.json({ error: 'セッション種別のコイン設定が無効です' }, { status: 400 })
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

    // ブロック枠チェック（時間指定ブロック）
    const { data: blockedSlots } = await adminClient
      .from('reservations')
      .select('id')
      .eq('is_blocked', true)
      .eq('reserved_at', reservedAtCheck)
      .limit(1)

    // 終日ブロックチェック
    const { data: allDayBlocks } = await adminClient
      .from('reservations')
      .select('id')
      .eq('is_blocked', true)
      .eq('is_all_day_block', true)
      .gte('reserved_at', `${date}T00:00:00`)
      .lt('reserved_at', `${date}T23:59:59`)
      .limit(1)

    if ((blockedSlots && blockedSlots.length > 0) || (allDayBlocks && allDayBlocks.length > 0)) {
      return NextResponse.json({ error: 'この時間帯は予約できません' }, { status: 400 })
    }

    // 残高確認（期限切れを除外）
    const now = new Date().toISOString()
    const { data: ledgers } = await adminClient
      .from('coin_ledgers')
      .select('amount_current')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', now)

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
    // 同一メンター・同時刻の重複はDB側のUNIQUE制約で防止
    const { data: reservation, error: reservationError } = await adminClient
      .from('reservations')
      .insert({
        user_id: user.id,
        mentor_id: mentorId,
        session_id: trainingSession.id,
        coins_used: sessionType.coin_cost,
        reserved_at: reservedAtCheck,
        status: 'pending',
      })
      .select()
      .single()

    if (reservationError) {
      // UNIQUE制約違反（23505）= 二重ブッキング
      if (reservationError.code === '23505') {
        await adminClient.from('training_sessions').delete().eq('id', trainingSession.id)
        return NextResponse.json({ error: 'この時間帯は既に予約が入っています' }, { status: 409 })
      }
      console.error('Reservation error:', reservationError)
      await adminClient.from('training_sessions').delete().eq('id', trainingSession.id)
      return NextResponse.json({ error: '予約の作成に失敗しました' }, { status: 500 })
    }

    // 3. コインをロック（FIFO順）- ロールバック保護付き
    // 期限切れコインを除外してロック
    const lockedUpdates: { id: string; prevCurrent: number; prevLocked: number }[] = []

    try {
      let remainingToLock = sessionType.coin_cost
      const lockNow = new Date().toISOString()

      const { data: activeLedgers } = await adminClient
        .from('coin_ledgers')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('amount_current', 0)
        .gt('expires_at', lockNow)
        .order('expires_at', { ascending: true })
        .order('granted_at', { ascending: true })

      for (const ledger of activeLedgers || []) {
        if (remainingToLock <= 0) break

        const lockAmount = Math.min(ledger.amount_current, remainingToLock)

        // 楽観的ロック: amount_currentが変わっていないことを確認
        const { data: updated, error: lockError } = await adminClient
          .from('coin_ledgers')
          .update({
            amount_current: ledger.amount_current - lockAmount,
            amount_locked: ledger.amount_locked + lockAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', ledger.id)
          .eq('amount_current', ledger.amount_current)
          .select('id')

        if (lockError) throw new Error(`コインロック失敗: ${lockError.message}`)
        if (!updated || updated.length === 0) {
          throw new Error('コインが他の操作で更新されました。もう一度お試しください')
        }

        lockedUpdates.push({
          id: ledger.id,
          prevCurrent: ledger.amount_current,
          prevLocked: ledger.amount_locked,
        })

        remainingToLock -= lockAmount
      }

      if (remainingToLock > 0) {
        throw new Error('コインロック中に残高不足が発生しました')
      }
    } catch (lockErr) {
      // コインロック失敗時: ロールバック
      for (const update of lockedUpdates) {
        await adminClient
          .from('coin_ledgers')
          .update({
            amount_current: update.prevCurrent,
            amount_locked: update.prevLocked,
          })
          .eq('id', update.id)
      }
      // 予約とセッションも削除
      await adminClient.from('reservations').delete().eq('id', reservation.id)
      await adminClient.from('training_sessions').delete().eq('id', trainingSession.id)
      console.error('Coin lock rollback:', lockErr)
      return NextResponse.json({ error: 'コインのロックに失敗しました。もう一度お試しください' }, { status: 409 })
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

    revalidatePath('/dashboard')
    revalidatePath('/mentor')
    revalidatePath('/admin')
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
