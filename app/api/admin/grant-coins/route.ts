import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'

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

    // リクエストボディ
    const { userId, amount, description } = await request.json()

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ error: '無効なパラメータです' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 有効期限（90日後）
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 90)

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
      console.error('Transaction error:', txError)
    }

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
