import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'

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

    const { userId, mentorId, sessionTypeId, dayOfWeek, startTime, endTime, notes } = await request.json()

    if (!userId || !mentorId || !sessionTypeId || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('recurring_reservations')
      .insert({
        user_id: userId,
        mentor_id: mentorId,
        session_type_id: sessionTypeId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        notes: notes || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Recurring reservation error:', error)
      return NextResponse.json({ error: '登録に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (error) {
    console.error('Recurring API error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
