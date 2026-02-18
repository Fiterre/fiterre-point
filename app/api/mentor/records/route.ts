import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isMentor } from '@/lib/queries/auth'
import { createRecord } from '@/lib/queries/trainingRecords'
import { isValidUUID, isValidDate } from '@/lib/validation'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const mentorAuth = await isMentor(user.id)
    if (!mentorAuth) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // メンターIDを取得
    const { data: mentor } = await adminClient
      .from('mentors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const { userId, recordDate, recordType, title, content, exercises, notes } = await request.json()

    if (!userId || !recordDate || !recordType || !content) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
    }

    // 入力バリデーション
    if (!isValidUUID(userId)) {
      return NextResponse.json({ error: '無効なユーザーIDです' }, { status: 400 })
    }
    if (!isValidDate(recordDate)) {
      return NextResponse.json({ error: '無効な日付フォーマットです' }, { status: 400 })
    }
    if (!['daily', 'monthly'].includes(recordType)) {
      return NextResponse.json({ error: '無効な記録タイプです' }, { status: 400 })
    }

    // 対象ユーザーの存在確認
    const { data: targetUser } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (!targetUser) {
      return NextResponse.json({ error: '対象ユーザーが見つかりません' }, { status: 404 })
    }

    const record = await createRecord(
      userId,
      mentor?.id || null,
      null,
      recordDate,
      recordType,
      content,
      title,
      exercises,
      notes
    )

    if (!record) {
      return NextResponse.json({ error: '記録の作成に失敗しました' }, { status: 500 })
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error('Create record error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
