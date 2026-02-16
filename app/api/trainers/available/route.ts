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
    const dayOfWeek = new Date(date).getDay()

    const supabase = await createClient()

    // その曜日・時間にシフトがあるトレーナーを取得
    const { data: shifts, error } = await supabase
      .from('trainer_shifts')
      .select(`
        trainer_id,
        trainers (
          id,
          specialty,
          profiles (
            display_name
          )
        )
      `)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .lte('start_time', time + ':00')
      .gte('end_time', time + ':00')

    if (error) {
      console.error('Error fetching available trainers:', error)
      return NextResponse.json({ error: 'トレーナー取得に失敗しました' }, { status: 500 })
    }

    // 重複を除去してトレーナーリストを作成
    const trainersMap = new Map()
    shifts?.forEach(shift => {
      const trainer = shift.trainers as unknown as { id: string; specialty: string; profiles: { display_name: string }[] } | null
      if (trainer && !trainersMap.has(trainer.id)) {
        trainersMap.set(trainer.id, trainer)
      }
    })

    const trainers = Array.from(trainersMap.values())

    return NextResponse.json({ trainers, dayOfWeek })
  } catch (error) {
    console.error('Available trainers API error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
