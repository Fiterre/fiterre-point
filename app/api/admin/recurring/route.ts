import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'
import { revalidatePath } from 'next/cache'

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

    // バリデーション: 曜日範囲
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json({ error: '曜日の値が不正です (0-6)' }, { status: 400 })
    }

    // バリデーション: 時刻フォーマット
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json({ error: '時刻フォーマットが不正です (HH:MM)' }, { status: 400 })
    }

    if (startTime >= endTime) {
      return NextResponse.json({ error: '開始時刻は終了時刻より前である必要があります' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // ユーザー状態チェック
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', userId)
      .maybeSingle()

    if (!userProfile) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }
    if (userProfile.status !== 'active') {
      return NextResponse.json({ error: 'アカウントが制限されているユーザーです' }, { status: 400 })
    }

    // セッションタイプ存在チェック
    const { data: sessionType } = await supabase
      .from('session_types')
      .select('id')
      .eq('id', sessionTypeId)
      .eq('is_active', true)
      .maybeSingle()

    if (!sessionType) {
      return NextResponse.json({ error: 'セッションタイプが見つかりません' }, { status: 404 })
    }

    // メンターのシフト確認
    const { data: shiftCheck } = await supabase
      .from('mentor_shifts')
      .select('id')
      .eq('mentor_id', mentorId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .lte('start_time', startTime)
      .gt('end_time', startTime)
      .limit(1)

    if (!shiftCheck || shiftCheck.length === 0) {
      return NextResponse.json({ error: 'この曜日・時間帯にメンターのシフトがありません' }, { status: 400 })
    }

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

    revalidatePath('/admin/recurring')
    return NextResponse.json({ success: true, id: data.id })
  } catch (error) {
    console.error('Recurring API error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}

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
      .from('recurring_reservations')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Recurring delete error:', error)
      return NextResponse.json({ error: '無効化に失敗しました' }, { status: 500 })
    }

    revalidatePath('/admin/recurring')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Recurring DELETE API error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
