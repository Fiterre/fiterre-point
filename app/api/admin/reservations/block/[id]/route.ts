import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'

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

    const { id } = await params

    const supabase = createAdminClient()

    // ブロック予約のみ削除可能
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id)
      .eq('is_blocked', true)

    if (error) {
      throw new Error(`ブロック削除に失敗しました: ${error.message}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Block delete error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'サーバーエラー',
    }, { status: 500 })
  }
}
