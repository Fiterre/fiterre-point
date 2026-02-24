import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'
import { revalidatePath } from 'next/cache'

const DAY_LABELS = ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜']

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

    // 削除対象のシフト情報を取得（関連データの整合性チェック用）
    const { data: shift } = await supabase
      .from('mentor_shifts')
      .select('mentor_id, day_of_week, start_time, end_time')
      .eq('id', id)
      .single()

    if (!shift) {
      return NextResponse.json({ error: 'シフトが見つかりません' }, { status: 404 })
    }

    // このシフトに依存する固定予約を無効化
    await supabase
      .from('recurring_reservations')
      .update({ is_active: false })
      .eq('mentor_id', shift.mentor_id)
      .eq('day_of_week', shift.day_of_week)
      .gte('start_time', shift.start_time)
      .lt('start_time', shift.end_time)
      .eq('is_active', true)

    const { error } = await supabase
      .from('mentor_shifts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Shift deletion error:', error)
      return NextResponse.json({ error: 'シフト削除に失敗しました' }, { status: 500 })
    }

    revalidatePath('/admin/shifts')
    revalidatePath('/admin/recurring')
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

    let body: { mentorId?: string; days?: number[]; startTime?: string; endTime?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: '無効なリクエスト形式です' }, { status: 400 })
    }
    const { mentorId, days, startTime, endTime } = body

    if (!mentorId || !days || days.length === 0 || !startTime || !endTime) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
    }

    // バリデーション: 曜日範囲チェック (0=日曜 ~ 6=土曜)
    if (!Array.isArray(days) || days.some((d: number) => !Number.isInteger(d) || d < 0 || d > 6)) {
      return NextResponse.json({ error: '曜日の値が不正です (0-6)' }, { status: 400 })
    }

    // バリデーション: 時刻フォーマット HH:MM
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json({ error: '時刻フォーマットが不正です (HH:MM)' }, { status: 400 })
    }

    // バリデーション: 開始時刻 < 終了時刻
    if (startTime >= endTime) {
      return NextResponse.json({ error: '開始時刻は終了時刻より前である必要があります' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // メンターの存在チェック
    const { data: mentorExists } = await supabase
      .from('mentors')
      .select('id')
      .eq('id', mentorId)
      .maybeSingle()

    if (!mentorExists) {
      return NextResponse.json({ error: 'メンターが見つかりません' }, { status: 404 })
    }

    // 重複チェック: 同一メンター・同一曜日・時間帯が重なるシフト
    const { data: existingShifts } = await supabase
      .from('mentor_shifts')
      .select('day_of_week, start_time, end_time')
      .eq('mentor_id', mentorId)
      .eq('is_active', true)
      .in('day_of_week', days)

    if (existingShifts && existingShifts.length > 0) {
      const conflicts = existingShifts.filter(
        (s) => startTime < s.end_time && endTime > s.start_time
      )
      if (conflicts.length > 0) {
        const conflictDays = [...new Set(conflicts.map(c => DAY_LABELS[c.day_of_week]))].join('・')
        return NextResponse.json({
          error: `${conflictDays}に重複するシフトがあります（${conflicts[0].start_time}〜${conflicts[0].end_time}）`,
        }, { status: 409 })
      }
    }

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

    revalidatePath('/admin/shifts')
    return NextResponse.json({
      success: true,
      count: data.length,
    })
  } catch (error) {
    console.error('Shift API error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
