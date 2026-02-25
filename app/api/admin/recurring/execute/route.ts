import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'
import { getSetting } from '@/lib/queries/settings'
import { revalidatePath } from 'next/cache'

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const admin = await isAdmin(user.id)
    if (!admin) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const { targetMonth } = await request.json()

    // targetMonth: 'next' または 'YYYY-MM' 形式
    let targetYear: number
    let targetMonthNum: number

    if (targetMonth === 'next') {
      const now = new Date()
      targetYear = now.getFullYear()
      targetMonthNum = now.getMonth() + 2 // 翌月（0-indexed なので +2）
      if (targetMonthNum > 12) {
        targetYear++
        targetMonthNum = 1
      }
    } else {
      [targetYear, targetMonthNum] = targetMonth.split('-').map(Number)
    }

    const supabase = createAdminClient()

    // アクティブな固定予約を取得
    const { data: recurringReservations, error: fetchError } = await supabase
      .from('recurring_reservations')
      .select(`
        *,
        session_types (
          id,
          duration_minutes,
          coin_cost
        )
      `)
      .eq('is_active', true)

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json({ error: '固定予約の取得に失敗しました' }, { status: 500 })
    }

    if (!recurringReservations || recurringReservations.length === 0) {
      return NextResponse.json({
        success: true,
        message: '固定予約がありません',
        created: 0,
        skipped: 0
      })
    }

    // 対象月の全日付を取得し、曜日でマッピング
    const datesInMonth: { [key: number]: string[] } = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
    const daysInMonth = new Date(targetYear, targetMonthNum, 0).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(targetYear, targetMonthNum - 1, day)
      const dayOfWeek = date.getDay()
      const dateStr = `${targetYear}-${String(targetMonthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      datesInMonth[dayOfWeek].push(dateStr)
    }

    let created = 0
    let skipped = 0
    const errors: string[] = []

    const monthStart = `${targetYear}-${String(targetMonthNum).padStart(2, '0')}-01`
    const monthEnd = `${targetYear}-${String(targetMonthNum).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

    // ============================================================
    // 一括事前取得（N+1クエリ防止）
    // ============================================================
    const businessHours = await getSetting('business_hours') as Record<string, { open: string; close: string; is_open: boolean }> | null

    const { data: closures } = await supabase
      .from('business_closures')
      .select('closure_date')
      .gte('closure_date', monthStart)
      .lte('closure_date', monthEnd)
    const closureDates = new Set(closures?.map(c => c.closure_date) ?? [])

    const { data: blockedSlots } = await supabase
      .from('reservations')
      .select('reserved_at, is_all_day_block')
      .eq('is_blocked', true)
      .gte('reserved_at', `${monthStart}T00:00:00`)
      .lte('reserved_at', `${monthEnd}T23:59:59`)

    const mentorIds = [...new Set(recurringReservations.map(r => r.mentor_id))]
    const userIds = [...new Set(recurringReservations.map(r => r.user_id))]

    const { data: mentorStatuses } = await supabase
      .from('mentors')
      .select('id, is_active')
      .in('id', mentorIds)

    const { data: userStatuses } = await supabase
      .from('profiles')
      .select('id, status')
      .in('id', userIds)

    // メンターシフト（全曜日・全メンターを一括取得）
    const { data: allMentorShifts } = await supabase
      .from('mentor_shifts')
      .select('mentor_id, day_of_week, start_time, end_time')
      .in('mentor_id', mentorIds)
      .eq('is_active', true)

    // 対象月の既存予約（重複チェック用）
    const { data: existingReservationsData } = await supabase
      .from('reservations')
      .select('user_id, reserved_at')
      .in('user_id', userIds)
      .gte('reserved_at', `${monthStart}T00:00:00`)
      .lte('reserved_at', `${monthEnd}T23:59:59`)

    // コイン台帳（インメモリで更新しながら使用・FIFO順）
    const nowISO = new Date().toISOString()
    const { data: allActiveLedgers } = await supabase
      .from('coin_ledgers')
      .select('*')
      .in('user_id', userIds)
      .eq('status', 'active')
      .gt('amount_current', 0)
      .gt('expires_at', nowISO)
      .order('expires_at', { ascending: true })

    // ============================================================
    // インメモリ検索用データ構造
    // ============================================================
    const mentorActiveMap = new Map(mentorStatuses?.map(m => [m.id, m.is_active]) ?? [])
    const userStatusMap = new Map(userStatuses?.map(u => [u.id, u.status]) ?? [])

    // 既存予約セット: "userId:YYYY-MM-DDTHH:MM" 形式
    const existingReservationSet = new Set(
      existingReservationsData?.map(r => `${r.user_id}:${r.reserved_at.slice(0, 16)}`) ?? []
    )

    // コイン台帳マップ: userId → ミュータブルな台帳配列
    const userLedgerMap = new Map<string, Array<{
      id: string
      amount_current: number
      amount_locked: number
    }>>()
    for (const ledger of allActiveLedgers ?? []) {
      if (!userLedgerMap.has(ledger.user_id)) {
        userLedgerMap.set(ledger.user_id, [])
      }
      userLedgerMap.get(ledger.user_id)!.push({
        id: ledger.id,
        amount_current: ledger.amount_current,
        amount_locked: ledger.amount_locked,
      })
    }

    // インメモリ残高取得
    const getInMemoryBalance = (userId: string) =>
      (userLedgerMap.get(userId) ?? []).reduce((sum, l) => sum + l.amount_current, 0)

    // コインロック（インメモリ更新 + DB更新）
    const lockCoinsInMemory = async (userId: string, coinCost: number) => {
      const ledgers = userLedgerMap.get(userId) ?? []
      let remaining = coinCost
      for (const ledger of ledgers) {
        if (remaining <= 0) break
        const lockAmount = Math.min(ledger.amount_current, remaining)
        ledger.amount_current -= lockAmount
        ledger.amount_locked += lockAmount
        remaining -= lockAmount
        await supabase
          .from('coin_ledgers')
          .update({
            amount_current: ledger.amount_current,
            amount_locked: ledger.amount_locked,
          })
          .eq('id', ledger.id)
      }
    }

    // ============================================================
    // 各固定予約について処理
    // ============================================================
    for (const recurring of recurringReservations) {
      // メンターがアクティブか検査
      if (!mentorActiveMap.get(recurring.mentor_id)) {
        for (const d of datesInMonth[recurring.day_of_week]) {
          await supabase.from('recurring_reservation_logs').insert({
            recurring_reservation_id: recurring.id,
            target_date: d,
            status: 'skipped',
            error_message: 'メンターが無効のためスキップ',
          })
          skipped++
        }
        continue
      }

      // ユーザーがアクティブか検査
      if (userStatusMap.get(recurring.user_id) !== 'active') {
        for (const d of datesInMonth[recurring.day_of_week]) {
          await supabase.from('recurring_reservation_logs').insert({
            recurring_reservation_id: recurring.id,
            target_date: d,
            status: 'skipped',
            error_message: 'ユーザーが無効のためスキップ',
          })
          skipped++
        }
        continue
      }

      const dates = datesInMonth[recurring.day_of_week]

      for (const targetDate of dates) {
        try {
          // 定休日チェック
          const dayKey = DAY_KEYS[recurring.day_of_week]
          const dayHours = businessHours?.[dayKey]
          if (dayHours && !dayHours.is_open) {
            await supabase.from('recurring_reservation_logs').insert({
              recurring_reservation_id: recurring.id,
              target_date: targetDate,
              status: 'skipped',
              error_message: '定休日のためスキップ',
            })
            skipped++
            continue
          }

          // 臨時休業日チェック
          if (closureDates.has(targetDate)) {
            await supabase.from('recurring_reservation_logs').insert({
              recurring_reservation_id: recurring.id,
              target_date: targetDate,
              status: 'skipped',
              error_message: '臨時休業日のためスキップ',
            })
            skipped++
            continue
          }

          // スケジュールブロックチェック（全日ブロック or 時間帯一致ブロック）
          const isScheduleBlocked = blockedSlots?.some(b => {
            const blockDate = b.reserved_at.split('T')[0]
            if (blockDate !== targetDate) return false
            return b.is_all_day_block || b.reserved_at.startsWith(`${targetDate}T${recurring.start_time}`)
          })
          if (isScheduleBlocked) {
            await supabase.from('recurring_reservation_logs').insert({
              recurring_reservation_id: recurring.id,
              target_date: targetDate,
              status: 'skipped',
              error_message: 'スケジュールブロックのためスキップ',
            })
            skipped++
            continue
          }

          // メンターシフトチェック（インメモリ）
          const hasShift = allMentorShifts?.some(s =>
            s.mentor_id === recurring.mentor_id &&
            s.day_of_week === recurring.day_of_week &&
            s.start_time <= recurring.start_time &&
            s.end_time > recurring.start_time
          ) ?? false
          if (!hasShift) {
            await supabase.from('recurring_reservation_logs').insert({
              recurring_reservation_id: recurring.id,
              target_date: targetDate,
              status: 'skipped',
              error_message: 'メンターのシフトがないためスキップ',
            })
            skipped++
            continue
          }

          // 既存予約チェック（インメモリ）
          const existKey = `${recurring.user_id}:${targetDate}T${recurring.start_time}`
          if (existingReservationSet.has(existKey)) {
            skipped++
            continue
          }

          // 残高チェック（インメモリ）
          const availableBalance = getInMemoryBalance(recurring.user_id)
          const coinCost = recurring.session_types?.coin_cost ?? 0

          if (availableBalance < coinCost) {
            await supabase.from('recurring_reservation_logs').insert({
              recurring_reservation_id: recurring.id,
              target_date: targetDate,
              status: 'skipped',
              error_message: `残高不足: 必要=${coinCost}, 残高=${availableBalance}`,
            })
            skipped++
            continue
          }

          // training_sessions を作成
          const { data: session, error: sessionError } = await supabase
            .from('training_sessions')
            .insert({
              mentor_id: recurring.mentor_id,
              session_type_id: recurring.session_type_id,
              scheduled_at: `${targetDate}T${recurring.start_time}:00`,
              duration_minutes: recurring.session_types?.duration_minutes ?? 60,
              status: 'scheduled',
            })
            .select()
            .single()

          if (sessionError) {
            throw new Error(`Session作成エラー: ${sessionError.message}`)
          }

          // 予約を作成
          const { data: reservation, error: reservationError } = await supabase
            .from('reservations')
            .insert({
              user_id: recurring.user_id,
              session_id: session.id,
              mentor_id: recurring.mentor_id,
              coins_used: coinCost,
              status: 'confirmed',
              reserved_at: `${targetDate}T${recurring.start_time}:00`,
            })
            .select()
            .single()

          if (reservationError) {
            throw new Error(`Reservation作成エラー: ${reservationError.message}`)
          }

          // 既存予約セットに追加（同一実行内の重複防止）
          existingReservationSet.add(existKey)

          // コインをロック（インメモリ更新 + DB更新）
          await lockCoinsInMemory(recurring.user_id, coinCost)

          // balance_after: インメモリの更新済み残高を使用（期限切れ除外済み）
          const balanceAfter = getInMemoryBalance(recurring.user_id)

          // 取引履歴
          await supabase.from('coin_transactions').insert({
            user_id: recurring.user_id,
            amount: -coinCost,
            balance_after: balanceAfter,
            type: 'reservation_lock',
            description: `固定予約: ${targetDate} ${recurring.start_time}〜`,
            reservation_id: reservation.id,
          })

          // ログ記録
          await supabase.from('recurring_reservation_logs').insert({
            recurring_reservation_id: recurring.id,
            reservation_id: reservation.id,
            target_date: targetDate,
            status: 'created',
          })

          created++
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '不明なエラー'
          errors.push(`${targetDate}: ${errorMessage}`)

          await supabase.from('recurring_reservation_logs').insert({
            recurring_reservation_id: recurring.id,
            target_date: targetDate,
            status: 'failed',
            error_message: errorMessage,
          })
        }
      }
    }

    revalidatePath('/admin/recurring')
    revalidatePath('/admin')
    revalidatePath('/dashboard')

    return NextResponse.json({
      created,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Execute recurring error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
