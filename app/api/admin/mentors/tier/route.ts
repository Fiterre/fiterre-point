import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'
import { isValidUUID } from '@/lib/validation'

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

    let body: { userId?: string; tierId?: string | null }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: '無効なリクエスト形式です' }, { status: 400 })
    }

    const { userId, tierId } = body

    if (!userId || !isValidUUID(userId)) {
      return NextResponse.json({ error: '有効なユーザーIDが必要です' }, { status: 400 })
    }

    // tierId が指定されている場合はUUID検証
    if (tierId !== null && tierId !== undefined && !isValidUUID(tierId)) {
      return NextResponse.json({ error: '無効なTier IDです' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // tierIdが指定されている場合、存在チェック
    if (tierId) {
      const { data: tierExists } = await supabase
        .from('role_tiers')
        .select('id')
        .eq('id', tierId)
        .maybeSingle()

      if (!tierExists) {
        return NextResponse.json({ error: '指定されたTierが見つかりません' }, { status: 404 })
      }
    }

    // 既存ロールを確認（admin/managerを降格させない）
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

    const currentRole = existingRole?.role
    const shouldPreserveRole = currentRole === 'admin' || currentRole === 'manager'

    const updateData: Record<string, unknown> = { tier_id: tierId || null }
    if (!shouldPreserveRole) {
      updateData.role = 'mentor'
    }

    const { error } = await supabase
      .from('user_roles')
      .update(updateData)
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
