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

    const { userId, tierId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('user_roles')
      .update({
        tier_id: tierId,
        role: 'mentor'  // メンターロールを確実に設定
      })
      .eq('user_id', userId)

    if (error) {
      throw new Error('Tier更新に失敗しました')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mentor tier update error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'サーバーエラー'
    }, { status: 500 })
  }
}
