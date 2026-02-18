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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('User status update error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'サーバーエラー',
    }, { status: 500 })
  }
}
