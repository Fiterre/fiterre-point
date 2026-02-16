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

    const { tiers } = await request.json()

    if (!tiers || !Array.isArray(tiers)) {
      return NextResponse.json({ error: '無効なパラメータです' }, { status: 400 })
    }

    const supabase = createAdminClient()

    for (const tier of tiers) {
      // Tier 1は更新しない
      if (tier.tier_level === 1) continue

      const { error } = await supabase
        .from('role_tiers')
        .update({
          permissions: tier.permissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', tier.id)

      if (error) {
        throw new Error(`Tier ${tier.tier_level} の更新に失敗しました`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Permissions update error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'サーバーエラー'
    }, { status: 500 })
  }
}
