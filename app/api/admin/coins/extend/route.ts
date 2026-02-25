import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'
import { bulkExtendExpiry } from '@/lib/queries/coins'
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

    let body: { ledgerIds?: string[]; additionalDays?: number }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: '無効なリクエスト形式です' }, { status: 400 })
    }
    const { ledgerIds, additionalDays } = body

    if (!ledgerIds || ledgerIds.length === 0 || !additionalDays) {
      return NextResponse.json({ error: '無効なパラメータです' }, { status: 400 })
    }

    // 対象レジャーの所有者ロールを一括確認（管理者・メンター所有分は除外）
    const supabase = createAdminClient()
    const { data: ledgerOwners } = await supabase
      .from('coin_ledgers')
      .select('id, user_id')
      .in('id', ledgerIds)

    const ownerUserIds = [...new Set((ledgerOwners ?? []).map(l => l.user_id))]
    const { data: nonCustomerRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('user_id', ownerUserIds)
      .in('role', ['admin', 'manager', 'mentor'])

    const nonCustomerSet = new Set((nonCustomerRoles ?? []).map(r => r.user_id))
    const validLedgerIds = (ledgerOwners ?? [])
      .filter(l => !nonCustomerSet.has(l.user_id))
      .map(l => l.id)

    if (validLedgerIds.length === 0) {
      return NextResponse.json({ error: '有効な対象がありません（管理者・メンター所有のSCは延長できません）' }, { status: 400 })
    }

    const results = await bulkExtendExpiry(validLedgerIds, additionalDays)

    revalidatePath('/admin')
    revalidatePath('/dashboard')

    return NextResponse.json({
      success: results.success,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
    })
  } catch (error) {
    console.error('Extend expiry error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
