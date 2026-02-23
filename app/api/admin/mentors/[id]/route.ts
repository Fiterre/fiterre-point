import { NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'
import { createAdminClient } from '@/lib/supabase/admin'

// メンターの無効化・有効化
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const admin = await isAdmin(user.id)
    if (!admin) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const { id: mentorId } = await params
    const body = await request.json()
    const isActive = typeof body.is_active === 'boolean' ? body.is_active : null

    if (isActive === null) {
      return NextResponse.json({ error: 'is_active パラメータが必要です' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('mentors')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', mentorId)

    if (error) {
      throw new Error(`メンター更新に失敗: ${error.message}`)
    }

    // メンター無効化時はシフトも無効化
    if (!isActive) {
      await supabase
        .from('mentor_shifts')
        .update({ is_active: false })
        .eq('mentor_id', mentorId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mentor update error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'サーバーエラー',
    }, { status: 500 })
  }
}

// メンターの削除（論理削除: is_active=false + ロール削除）
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const admin = await isAdmin(user.id)
    if (!admin) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const { id: mentorId } = await params
    const supabase = createAdminClient()

    // メンター情報を取得
    const { data: mentor, error: fetchError } = await supabase
      .from('mentors')
      .select('user_id')
      .eq('id', mentorId)
      .single()

    if (fetchError || !mentor) {
      return NextResponse.json({ error: 'メンターが見つかりません' }, { status: 404 })
    }

    // メンターを無効化
    const { error: updateError } = await supabase
      .from('mentors')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', mentorId)

    if (updateError) {
      throw new Error(`メンター無効化に失敗: ${updateError.message}`)
    }

    // シフトも無効化
    await supabase
      .from('mentor_shifts')
      .update({ is_active: false })
      .eq('mentor_id', mentorId)

    // メンターロールを削除（ユーザーロールに戻す）
    const { error: roleError } = await supabase
      .from('user_roles')
      .update({
        role: 'user',
      })
      .eq('user_id', mentor.user_id)
      .eq('role', 'mentor')

    if (roleError) {
      console.error('Role update warning:', roleError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mentor delete error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'サーバーエラー',
    }, { status: 500 })
  }
}
