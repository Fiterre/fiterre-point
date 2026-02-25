import { NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { writeAuditLog } from '@/lib/queries/auditLog'
import { isValidUUID } from '@/lib/validation'

export async function PATCH(
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

    const { id: targetUserId } = await params

    if (!isValidUUID(targetUserId)) {
      return NextResponse.json({ error: '無効なユーザーIDです' }, { status: 400 })
    }

    const body = await request.json()
    const status = typeof body.status === 'string' ? body.status : ''

    const validStatuses = ['active', 'suspended', 'locked', 'deleted']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: '無効なステータスです' }, { status: 400 })
    }

    // 自分自身のステータスは変更不可
    if (targetUserId === user.id) {
      return NextResponse.json({ error: '自分自身のステータスは変更できません' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('profiles')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetUserId)

    if (error) {
      throw new Error(`ステータス更新に失敗: ${error.message}`)
    }

    // 停止・削除時は未来の予約を自動キャンセル＋ロック済みコイン返還
    if (status !== 'active') {
      const today = new Date().toISOString().split('T')[0]

      // キャンセル対象の予約を取得（コイン返還のため先にデータ取得）
      const { data: reservationsToCancel } = await supabase
        .from('reservations')
        .select('id, user_id, coins_used')
        .eq('user_id', targetUserId)
        .in('status', ['pending', 'confirmed'])
        .gte('reserved_at', `${today}T00:00:00`)
        .eq('is_blocked', false)

      // 予約をキャンセル
      if (reservationsToCancel && reservationsToCancel.length > 0) {
        const reservationIds = reservationsToCancel.map(r => r.id)
        await supabase
          .from('reservations')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .in('id', reservationIds)

        // ロック済みコインを返還
        const totalCoinsToRefund = reservationsToCancel.reduce((sum, r) => sum + (r.coins_used || 0), 0)
        if (totalCoinsToRefund > 0) {
          const { data: lockedLedgers } = await supabase
            .from('coin_ledgers')
            .select('*')
            .eq('user_id', targetUserId)
            .eq('status', 'active')
            .gt('amount_locked', 0)
            .order('expires_at', { ascending: true })

          let remainingToUnlock = totalCoinsToRefund
          for (const ledger of lockedLedgers || []) {
            if (remainingToUnlock <= 0) break
            const unlockAmount = Math.min(ledger.amount_locked, remainingToUnlock)
            await supabase
              .from('coin_ledgers')
              .update({
                amount_current: ledger.amount_current + unlockAmount,
                amount_locked: ledger.amount_locked - unlockAmount,
                updated_at: new Date().toISOString(),
              })
              .eq('id', ledger.id)
            remainingToUnlock -= unlockAmount
          }

          // 返還取引履歴を記録（期限切れコインを除外）
          const { data: newLedgers } = await supabase
            .from('coin_ledgers')
            .select('amount_current')
            .eq('user_id', targetUserId)
            .eq('status', 'active')
            .gt('expires_at', new Date().toISOString())
          const newBalance = newLedgers?.reduce((sum, l) => sum + l.amount_current, 0) ?? 0

          await supabase
            .from('coin_transactions')
            .insert({
              user_id: targetUserId,
              amount: totalCoinsToRefund,
              balance_after: newBalance,
              type: 'reservation_cancel',
              description: `アカウント${status === 'suspended' ? '停止' : status === 'deleted' ? '削除' : '制限'}に伴う一括返還（${reservationsToCancel.length}件）`,
              executed_by: user.id,
            })
        }
      }

      // 固定予約も無効化
      await supabase
        .from('recurring_reservations')
        .update({ is_active: false })
        .eq('user_id', targetUserId)
        .eq('is_active', true)
    }

    // 監査ログ
    await writeAuditLog({
      actor_id: user.id,
      action: 'user_status_changed',
      resource_type: 'user',
      resource_id: targetUserId,
      changes: { status },
    })

    revalidatePath('/admin/users')
    revalidatePath('/admin/recurring')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('User status update error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'サーバーエラー',
    }, { status: 500 })
  }
}
