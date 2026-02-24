import { NextResponse } from 'next/server'
import { getSetting } from '@/lib/queries/settings'
import { getClosures } from '@/lib/queries/businessHours'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

interface DayHours {
  open: string
  close: string
  is_open: boolean
}

interface BusinessHours {
  [key: string]: DayHours
}

export async function GET(request: Request) {
  try {
    // 認証チェック
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: '日付が必要です' }, { status: 400 })
    }

    // 日付フォーマット検証
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: '日付フォーマットが不正です (YYYY-MM-DD)' }, { status: 400 })
    }

    // 曜日を取得
    const dayOfWeek = new Date(date + 'T00:00:00').getDay()
    const dayKey = DAY_KEYS[dayOfWeek]

    // 営業時間・スロット間隔を取得
    const [businessHours, slotInterval, closures] = await Promise.all([
      getSetting('business_hours') as Promise<BusinessHours | null>,
      getSetting('slot_interval_minutes') as Promise<number | null>,
      getClosures(date),
    ])

    // 臨時休業日チェック
    const isClosed = closures.some(c => c.closure_date === date)
    if (isClosed) {
      return NextResponse.json({ slots: [], reason: 'closed_holiday' })
    }

    // 営業時間設定がない場合はデフォルト値
    const defaultHours: DayHours = { open: '09:00', close: '21:00', is_open: true }
    const dayHours: DayHours = businessHours?.[dayKey] ?? defaultHours

    // 定休日チェック
    if (!dayHours.is_open) {
      return NextResponse.json({ slots: [], reason: 'regular_holiday' })
    }

    // 有効な時間枠を生成
    const interval = (slotInterval && slotInterval > 0) ? slotInterval : 30
    const slots: string[] = []
    const [openH, openM] = dayHours.open.split(':').map(Number)
    const [closeH, closeM] = dayHours.close.split(':').map(Number)
    const openMinutes = openH * 60 + openM
    const closeMinutes = closeH * 60 + closeM

    if (openMinutes >= closeMinutes) {
      return NextResponse.json({ slots: [], reason: 'invalid_hours' })
    }

    for (let m = openMinutes; m < closeMinutes; m += interval) {
      const h = Math.floor(m / 60)
      const min = m % 60
      slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
    }

    // ブロック枠を除外
    const adminClient = createAdminClient()
    const { data: blocks } = await adminClient
      .from('reservations')
      .select('reserved_at, is_all_day_block')
      .eq('is_blocked', true)
      .gte('reserved_at', `${date}T00:00:00`)
      .lte('reserved_at', `${date}T23:59:59`)

    let availableSlots = slots

    if (blocks && blocks.length > 0) {
      const isAllDayBlocked = blocks.some(b => b.is_all_day_block)
      if (isAllDayBlocked) {
        return NextResponse.json({ slots: [], reason: 'blocked' })
      }

      const blockedTimes = new Set(
        blocks.map(b => b.reserved_at?.substring(11, 16))
      )
      availableSlots = availableSlots.filter(slot => !blockedTimes.has(slot))
    }

    // メンターシフトがある時間枠のみに絞り込む
    const { data: shiftsForDay } = await adminClient
      .from('mentor_shifts')
      .select('start_time, end_time')
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)

    if (shiftsForDay && shiftsForDay.length > 0) {
      availableSlots = availableSlots.filter(slot =>
        shiftsForDay.some(shift => slot >= shift.start_time && slot < shift.end_time)
      )
    } else {
      // アクティブなシフトが一件もない場合は空を返す
      return NextResponse.json({ slots: [], reason: 'no_mentors' })
    }

    return NextResponse.json({ slots: availableSlots, interval, dayOfWeek })
  } catch (error) {
    console.error('Available slots API error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
