import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSetting } from '@/lib/queries/settings'
import { createAdminClient } from '@/lib/supabase/admin'

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const time = searchParams.get('time')

    if (!date || !time) {
      return NextResponse.json({ error: '日付と時間が必要です' }, { status: 400 })
    }

    // 曜日を計算（0=日曜, 1=月曜, ...）
    const dayOfWeek = new Date(date + 'T00:00:00').getDay()
    const dayKey = DAY_KEYS[dayOfWeek]

    // 営業時間チェック（定休日ならメンター不要）
    const businessHours = await getSetting('business_hours') as Record<string, { open: string; close: string; is_open: boolean }> | null
    const dayHours = businessHours?.[dayKey]
    if (dayHours && !dayHours.is_open) {
      return NextResponse.json({ mentors: [], dayOfWeek })
    }

    // 臨時休業日チェック
    const adminClient = createAdminClient()
    const { data: closureCheck } = await adminClient
      .from('business_closures')
      .select('id')
      .eq('closure_date', date)
      .limit(1)

    if (closureCheck && closureCheck.length > 0) {
      return NextResponse.json({ mentors: [], dayOfWeek })
    }

    const supabase = await createClient()

    // その曜日・時間にシフトがあるメンターを取得
    // start_time <= 選択時刻 かつ end_time > 選択時刻（終了時刻ちょうどは含まない）
    const { data: shifts, error } = await supabase
      .from('mentor_shifts')
      .select(`
        mentor_id,
        mentors (
          id,
          name,
          is_active,
          profiles:user_id (
            display_name
          )
        )
      `)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .lte('start_time', time)
      .gt('end_time', time)

    if (error) {
      console.error('Error fetching available mentors:', error)
      return NextResponse.json({ error: 'メンター取得に失敗しました' }, { status: 500 })
    }

    // 重複を除去してメンターリストを作成（is_activeなメンターのみ）
    const mentorsMap = new Map()
    shifts?.forEach(shift => {
      const mentor = shift.mentors as unknown as { id: string; name: string; is_active: boolean; profiles: { display_name: string }[] } | null
      if (mentor && mentor.is_active && !mentorsMap.has(mentor.id)) {
        mentorsMap.set(mentor.id, mentor)
      }
    })

    const mentors = Array.from(mentorsMap.values())

    return NextResponse.json({ mentors, dayOfWeek })
  } catch (error) {
    console.error('Available mentors API error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
