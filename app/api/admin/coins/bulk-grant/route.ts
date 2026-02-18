import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'
import { getSetting } from '@/lib/queries/settings'
import { isPositiveInteger } from '@/lib/validation'

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

    const { userIds, amount, description } = await request.json()

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !amount || amount <= 0) {
      return NextResponse.json({ error: '無効なパラメータです' }, { status: 400 })
    }

    if (!isPositiveInteger(amount) || amount > 100000) {
      return NextResponse.json({ error: '無効なコイン数です' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 有効期限をsystem_settingsから取得（デフォルト90日）
    const coinExpiryDays = (await getSetting('coin_expiry_days')) || 90
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + Number(coinExpiryDays))

    let successCount = 0
    const errors: string[] = []

    for (const userId of userIds) {
      try {
        // コイン台帳に追加
        const { data: ledger, error: ledgerError } = await supabase
          .from('coin_ledgers')
          .insert({
            user_id: userId,
            amount_initial: amount,
            amount_current: amount,
            amount_locked: 0,
            expires_at: expiresAt.toISOString(),
            source_type: 'admin_adjust',
          })
          .select()
          .single()

        if (ledgerError) throw ledgerError

        // 残高計算
        const { data: ledgers } = await supabase
          .from('coin_ledgers')
          .select('amount_current, amount_locked')
          .eq('user_id', userId)
          .eq('status', 'active')

        const totalBalance = ledgers?.reduce(
          (sum, l) => sum + l.amount_current + l.amount_locked,
          0
        ) ?? amount

        // 取引履歴に追加
        await supabase
          .from('coin_transactions')
          .insert({
            user_id: userId,
            amount: amount,
            balance_after: totalBalance,
            type: 'admin_adjust',
            description: description,
            ledger_id: ledger.id,
            executed_by: user.id,
          })

        successCount++
      } catch (error) {
        errors.push(`${userId}: ${error instanceof Error ? error.message : '不明なエラー'}`)
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      failedCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Bulk grant error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
