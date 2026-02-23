import { NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'
import { createAdminClient } from '@/lib/supabase/admin'

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

    const { id: targetUserId } = await params
    const body = await request.json()
    const status = typeof body.status === 'string' ? body.status : ''

    const validStatuses = ['active', 'suspended', 'locked', 'deleted']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: '無効なステータスです' }, { status: 400 })
    }

    // 自分自身のステータスは変更不可
    if (targetUserId === user.id) {
      return NextResponse.json({ error: '自分自身のステータスは変更できません' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('profiles')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetUserId)

    if (error) {
      throw new Error(`ステータス更新に失敗: ${error.message}`)
    }

    // 停止・削除時は未来の予約を自動キャンセル
    if (status !== 'active') {
      const today = new Date().toISOString().split('T')[0]
      await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('user_id', targetUserId)
        .in('status', ['pending', 'confirmed'])
        .gte('reserved_at', `${today}T00:00:00`)
        .eq('is_blocked', false)

      // 固定予約も無効化
      await supabase
        .from('recurring_reservations')
        .update({ is_active: false })
        .eq('user_id', targetUserId)
        .eq('is_active', true)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('User status update error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'サーバーエラー',
    }, { status: 500 })
  }
}
