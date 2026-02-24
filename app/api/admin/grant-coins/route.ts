import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'
import { getSetting } from '@/lib/queries/settings'
import { isValidUUID, isPositiveInteger } from '@/lib/validation'
import { revalidatePath } from 'next/cache'
import { writeAuditLog } from '@/lib/queries/auditLog'

export async function POST(request: Request) {
  try {
    // 管理者チェック
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const admin = await isAdmin(user.id)
    if (!admin) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    // リクエストボディ（JSON解析エラーハンドリング）
    let body: { userId?: string; amount?: number; description?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: '無効なリクエスト形式です' }, { status: 400 })
    }
    const { userId, amount, description } = body

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ error: '無効なパラメータです' }, { status: 400 })
    }

    if (!isValidUUID(userId)) {
      return NextResponse.json({ error: '無効なユーザーIDです' }, { status: 400 })
    }

    if (!isPositiveInteger(amount) || amount > 100000) {
      return NextResponse.json({ error: '無効なコイン数です' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // ユーザー存在確認
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id, status')
      .eq('id', userId)
      .maybeSingle()

    if (!targetUser) {
      return NextResponse.json({ error: '対象ユーザーが見つかりません' }, { status: 404 })
    }

    if (targetUser.status && targetUser.status !== 'active') {
      return NextResponse.json({ error: '対象ユーザーは現在利用停止中です' }, { status: 400 })
    }

    // 有効期限をsystem_settingsから取得（デフォルト90日）
    const coinExpiryDays = (await getSetting('coin_expiry_days')) || 90
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + Number(coinExpiryDays))

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

    if (ledgerError) {
      console.error('Ledger error:', ledgerError)
      return NextResponse.json({ error: 'コイン付与に失敗しました' }, { status: 500 })
    }

    // 現在の残高を計算
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
    const { error: txError } = await supabase
      .from('coin_transactions')
      .insert({
        user_id: userId,
        type: 'admin_adjust',
        amount: amount,
        balance_after: totalBalance,
        description: description,
        executed_by: user.id,
        ledger_id: ledger.id,
      })

    if (txError) {
      // 取引履歴の記録失敗はコイン付与を無効化すべき重大エラー
      console.error('Transaction record error:', txError)
      // ledgerを削除してロールバック
      await supabase.from('coin_ledgers').delete().eq('id', ledger.id)
      return NextResponse.json({ error: '取引履歴の記録に失敗しました。コイン付与を取り消しました' }, { status: 500 })
    }

    // 監査ログ
    await writeAuditLog({
      actor_id: user.id,
      action: 'coins_granted',
      resource_type: 'coin_ledger',
      resource_id: ledger.id,
      changes: { userId, amount, description },
    })

    revalidatePath('/admin')
    revalidatePath('/dashboard')

    return NextResponse.json({
      success: true,
      ledgerId: ledger.id,
      amount: amount,
      balance: totalBalance
    })
  } catch (error) {
    console.error('Grant coins error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
