import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, isAdmin, isMentor } from '@/lib/queries/auth'
import { getSetting } from '@/lib/queries/settings'
import { isPositiveInteger, isValidUUID } from '@/lib/validation'
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

    let body: { userIds?: string[]; amount?: number; description?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: '無効なリクエスト形式です' }, { status: 400 })
    }
    const { userIds, amount, description } = body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !amount || amount <= 0) {
      return NextResponse.json({ error: '無効なパラメータです' }, { status: 400 })
    }

    if (!isPositiveInteger(amount) || amount > 100000) {
      return NextResponse.json({ error: '無効なコイン数です' }, { status: 400 })
    }

    // 全userIdのUUID形式を検証
    const invalidIds = userIds.filter(id => !isValidUUID(id))
    if (invalidIds.length > 0) {
      return NextResponse.json({ error: `無効なユーザーID形式が含まれています: ${invalidIds.length}件` }, { status: 400 })
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
        // ユーザーステータス確認
        const { data: profile } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', userId)
          .maybeSingle()

        if (!profile) {
          errors.push(`${userId}: ユーザーが見つかりません`)
          continue
        }

        if (profile.status !== 'active') {
          errors.push(`${userId}: ユーザーが利用停止中です`)
          continue
        }

        // 管理者・メンターへはSC付与不可（顧客のみ）
        if (await isMentor(userId)) {
          errors.push(`${userId}: 管理者・メンターへはSCを付与できません`)
          continue
        }

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

        // 残高計算（期限切れコインを除外、ロック済みは含まない）
        const { data: ledgers } = await supabase
          .from('coin_ledgers')
          .select('amount_current')
          .eq('user_id', userId)
          .eq('status', 'active')
          .gt('expires_at', new Date().toISOString())

        const totalBalance = ledgers?.reduce(
          (sum, l) => sum + l.amount_current,
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

    revalidatePath('/admin')
    revalidatePath('/dashboard')

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
