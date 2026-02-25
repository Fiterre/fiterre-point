import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isAdmin, isMentor } from '@/lib/queries/auth'
import { isValidUUID } from '@/lib/validation'
import { revalidatePath } from 'next/cache'

const VALID_TRANSITIONS: Record<string, string[]> = {
  requested: ['ordering', 'cancelled'],
  ordering: ['completed', 'cancelled'],
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: '無効なIDです' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // admin/mentorのみステータス更新可能
    const admin = await isAdmin(user.id)
    const mentor = await isMentor(user.id)

    if (!admin && !mentor) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    let body: { status?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: '無効なリクエスト形式です' }, { status: 400 })
    }

    const { status: newStatus } = body
    if (!newStatus || !['ordering', 'completed', 'cancelled'].includes(newStatus)) {
      return NextResponse.json({ error: '無効なステータスです' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // 現在の申請を取得
    const { data: exchangeRequest, error: fetchError } = await adminClient
      .from('exchange_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !exchangeRequest) {
      return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 })
    }

    // 遷移バリデーション
    const allowedNext = VALID_TRANSITIONS[exchangeRequest.status]
    if (!allowedNext || !allowedNext.includes(newStatus)) {
      return NextResponse.json({
        error: `「${exchangeRequest.status}」から「${newStatus}」への変更はできません`
      }, { status: 400 })
    }

    // メンターは自分の申請を自己承認不可（管理者のみ completed/cancelled 可能）
    if (!admin && exchangeRequest.user_id === user.id) {
      return NextResponse.json({ error: '自分の申請を処理することはできません' }, { status: 403 })
    }
    if (!admin && newStatus === 'completed') {
      return NextResponse.json({ error: '対応済みへの変更は管理者のみ可能です' }, { status: 403 })
    }

    const now = new Date().toISOString()
    const updateData: Record<string, unknown> = {
      status: newStatus,
      processed_by: user.id,
      updated_at: now,
    }
    if (newStatus === 'completed') updateData.completed_at = now
    if (newStatus === 'cancelled') updateData.cancelled_at = now

    // ステータス更新を先に行い、楽観的ロックで二重処理を防止
    // .eq('status', currentStatus) により同時リクエストの一方だけが成功する
    const { data: updatedRows, error: updateError } = await adminClient
      .from('exchange_requests')
      .update(updateData)
      .eq('id', id)
      .eq('status', exchangeRequest.status) // 楽観的ロック
      .select('id')

    if (updateError) {
      console.error('Exchange status update error:', updateError)
      return NextResponse.json({ error: 'ステータス更新に失敗しました' }, { status: 500 })
    }
    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json({ error: '他の操作と競合しました。画面を更新して再試行してください' }, { status: 409 })
    }

    if (newStatus === 'completed') {
      // コインを消費（amount_locked を減らす、amount_current には戻さない）
      const { data: ledgers } = await adminClient
        .from('coin_ledgers')
        .select('*')
        .eq('user_id', exchangeRequest.user_id)
        .eq('status', 'active')
        .gt('amount_locked', 0)
        .order('expires_at', { ascending: true })

      let remainingToConsume = exchangeRequest.coins_locked

      for (const ledger of ledgers || []) {
        if (remainingToConsume <= 0) break

        const consumeAmount = Math.min(ledger.amount_locked, remainingToConsume)

        const { error: consumeError } = await adminClient
          .from('coin_ledgers')
          .update({
            amount_locked: ledger.amount_locked - consumeAmount,
            updated_at: now,
          })
          .eq('id', ledger.id)

        if (consumeError) throw new Error(`コイン消費に失敗しました: ${consumeError.message}`)

        remainingToConsume -= consumeAmount
      }

      // 残高再計算（期限切れコインを除外）
      const { data: newLedgers } = await adminClient
        .from('coin_ledgers')
        .select('amount_current')
        .eq('user_id', exchangeRequest.user_id)
        .eq('status', 'active')
        .gt('expires_at', now)

      const newBalance = newLedgers?.reduce((sum, l) => sum + l.amount_current, 0) ?? 0

      // 取引履歴に消費を記録
      await adminClient
        .from('coin_transactions')
        .insert({
          user_id: exchangeRequest.user_id,
          amount: -exchangeRequest.coins_locked,
          balance_after: newBalance,
          type: 'exchange_complete',
          description: `交換完了: ${exchangeRequest.coins_locked} SC消費`,
          executed_by: user.id,
        })
    }

    if (newStatus === 'cancelled') {
      // コインを返還（amount_locked → amount_current に戻す）
      const { data: ledgers } = await adminClient
        .from('coin_ledgers')
        .select('*')
        .eq('user_id', exchangeRequest.user_id)
        .eq('status', 'active')
        .gt('amount_locked', 0)
        .order('expires_at', { ascending: true })

      let remainingToUnlock = exchangeRequest.coins_locked

      for (const ledger of ledgers || []) {
        if (remainingToUnlock <= 0) break

        const unlockAmount = Math.min(ledger.amount_locked, remainingToUnlock)

        const { error: unlockError } = await adminClient
          .from('coin_ledgers')
          .update({
            amount_current: ledger.amount_current + unlockAmount,
            amount_locked: ledger.amount_locked - unlockAmount,
            updated_at: now,
          })
          .eq('id', ledger.id)

        if (unlockError) throw new Error(`コイン返還に失敗しました: ${unlockError.message}`)

        remainingToUnlock -= unlockAmount
      }

      // 残高再計算（期限切れコインを除外）
      const { data: newLedgers } = await adminClient
        .from('coin_ledgers')
        .select('amount_current')
        .eq('user_id', exchangeRequest.user_id)
        .eq('status', 'active')
        .gt('expires_at', now)

      const newBalance = newLedgers?.reduce((sum, l) => sum + l.amount_current, 0) ?? 0

      // 取引履歴に返還を記録
      await adminClient
        .from('coin_transactions')
        .insert({
          user_id: exchangeRequest.user_id,
          amount: exchangeRequest.coins_locked,
          balance_after: newBalance,
          type: 'exchange_cancel',
          description: `交換キャンセル: ${exchangeRequest.coins_locked} SC返還`,
          executed_by: user.id,
        })
    }

    revalidatePath('/dashboard')
    revalidatePath('/mentor')
    revalidatePath('/admin')

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error) {
    console.error('Exchange status API error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
