import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const admin = await isAdmin(user.id)
    if (!admin) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'IDが必要です' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('mentor_shifts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Shift deletion error:', error)
      return NextResponse.json({ error: 'シフト削除に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Shift DELETE API error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}

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

    const { mentorId, days, startTime, endTime } = await request.json()

    if (!mentorId || !days || days.length === 0 || !startTime || !endTime) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 各曜日のシフトを作成
    const shifts = days.map((day: number) => ({
      mentor_id: mentorId,
      day_of_week: day,
      start_time: startTime,
      end_time: endTime,
      is_active: true,
    }))

    const { data, error } = await supabase
      .from('mentor_shifts')
      .insert(shifts)
      .select()

    if (error) {
      console.error('Shift creation error:', error)
      return NextResponse.json({ error: 'シフト登録に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: data.length,
    })
  } catch (error) {
    console.error('Shift API error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
