import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const time = searchParams.get('time')

    if (!date || !time) {
      return NextResponse.json({ error: '日付と時間が必要です' }, { status: 400 })
    }

    // 曜日を計算（0=日曜, 1=月曜, ...）
    // UTC誤差を防ぐためローカル時間として解釈
    const dayOfWeek = new Date(date + 'T00:00:00').getDay()

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
