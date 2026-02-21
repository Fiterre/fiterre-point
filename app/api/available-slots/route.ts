import { NextResponse } from 'next/server'
import { getSetting } from '@/lib/queries/settings'
import { getClosures } from '@/lib/queries/businessHours'
import { createAdminClient } from '@/lib/supabase/admin'

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
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: '日付が必要です' }, { status: 400 })
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
    const interval = slotInterval ?? 30
    const slots: string[] = []
    const [openH, openM] = dayHours.open.split(':').map(Number)
    const [closeH, closeM] = dayHours.close.split(':').map(Number)
    const openMinutes = openH * 60 + openM
    const closeMinutes = closeH * 60 + closeM

    for (let m = openMinutes; m < closeMinutes; m += interval) {
      const h = Math.floor(m / 60)
      const min = m % 60
      slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
    }

    // ブロック枠を除外
    const supabase = createAdminClient()
    const { data: blocks } = await supabase
      .from('reservations')
      .select('reserved_at, is_all_day_block')
      .eq('is_blocked', true)
      .gte('reserved_at', `${date}T00:00:00`)
      .lte('reserved_at', `${date}T23:59:59`)

    if (blocks && blocks.length > 0) {
      const isAllDayBlocked = blocks.some(b => b.is_all_day_block)
      if (isAllDayBlocked) {
        return NextResponse.json({ slots: [], reason: 'blocked' })
      }

      const blockedTimes = new Set(
        blocks.map(b => b.reserved_at?.substring(11, 16))
      )
      const filteredSlots = slots.filter(slot => !blockedTimes.has(slot))
      return NextResponse.json({ slots: filteredSlots, interval })
    }

    return NextResponse.json({ slots, interval })
  } catch (error) {
    console.error('Available slots API error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
