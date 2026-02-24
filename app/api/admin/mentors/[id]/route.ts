import { NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// メンターの無効化・有効化
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

    const { id: mentorId } = await params
    const body = await request.json()
    const isActive = typeof body.is_active === 'boolean' ? body.is_active : null

    if (isActive === null) {
      return NextResponse.json({ error: 'is_active パラメータが必要です' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // メンター情報を取得（user_idが必要）
    const { data: mentorData } = await supabase
      .from('mentors')
      .select('user_id')
      .eq('id', mentorId)
      .single()

    if (!mentorData) {
      return NextResponse.json({ error: 'メンターが見つかりません' }, { status: 404 })
    }

    const { error } = await supabase
      .from('mentors')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', mentorId)

    if (error) {
      throw new Error(`メンター更新に失敗: ${error.message}`)
    }

    if (!isActive) {
      // メンター無効化時はシフトも無効化
      await supabase
        .from('mentor_shifts')
        .update({ is_active: false })
        .eq('mentor_id', mentorId)

      // ロールをuserに戻す（admin/managerは維持）
      await supabase
        .from('user_roles')
        .update({ role: 'user' })
        .eq('user_id', mentorData.user_id)
        .eq('role', 'mentor')
    } else {
      // メンター有効化時はロールをmentorに設定（admin/managerは維持）
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', mentorData.user_id)
        .maybeSingle()

      if (existingRole?.role === 'user') {
        await supabase
          .from('user_roles')
          .update({ role: 'mentor' })
          .eq('user_id', mentorData.user_id)
      }
    }

    revalidatePath('/admin/mentors')
    revalidatePath('/admin/shifts')
    revalidatePath('/admin/recurring')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mentor update error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'サーバーエラー',
    }, { status: 500 })
  }
}

// メンターの削除（物理削除、FK制約時は論理削除にフォールバック）
export async function DELETE(
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

    const { id: mentorId } = await params
    const supabase = createAdminClient()

    // メンター情報を取得
    const { data: mentor, error: fetchError } = await supabase
      .from('mentors')
      .select('user_id')
      .eq('id', mentorId)
      .single()

    if (fetchError || !mentor) {
      return NextResponse.json({ error: 'メンターが見つかりません' }, { status: 404 })
    }

    // 未来の予約をキャンセル＋コイン返還
    const today = new Date().toISOString().split('T')[0]
    const { data: futureReservations } = await supabase
      .from('reservations')
      .select('id, user_id, coins_used')
      .eq('mentor_id', mentorId)
      .in('status', ['pending', 'confirmed'])
      .gte('reserved_at', `${today}T00:00:00`)
      .eq('is_blocked', false)

    if (futureReservations && futureReservations.length > 0) {
      const reservationIds = futureReservations.map(r => r.id)
      await supabase
        .from('reservations')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .in('id', reservationIds)

      // ユーザーごとにコイン返還
      const refundByUser = new Map<string, number>()
      for (const r of futureReservations) {
        if (r.user_id && r.coins_used > 0) {
          refundByUser.set(r.user_id, (refundByUser.get(r.user_id) || 0) + r.coins_used)
        }
      }

      for (const [userId, totalRefund] of refundByUser) {
        const { data: lockedLedgers } = await supabase
          .from('coin_ledgers')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .gt('amount_locked', 0)
          .order('expires_at', { ascending: true })

        let remaining = totalRefund
        for (const ledger of lockedLedgers || []) {
          if (remaining <= 0) break
          const unlockAmount = Math.min(ledger.amount_locked, remaining)
          await supabase
            .from('coin_ledgers')
            .update({
              amount_current: ledger.amount_current + unlockAmount,
              amount_locked: ledger.amount_locked - unlockAmount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', ledger.id)
          remaining -= unlockAmount
        }

        const { data: newLedgers } = await supabase
          .from('coin_ledgers')
          .select('amount_current')
          .eq('user_id', userId)
          .eq('status', 'active')
        const newBalance = newLedgers?.reduce((sum, l) => sum + l.amount_current, 0) ?? 0

        await supabase.from('coin_transactions').insert({
          user_id: userId,
          amount: totalRefund,
          balance_after: newBalance,
          type: 'reservation_cancel',
          description: 'メンター削除に伴う返還',
          executed_by: user.id,
        })
      }
    }

    // シフトを物理削除
    await supabase
      .from('mentor_shifts')
      .delete()
      .eq('mentor_id', mentorId)

    // 固定予約を無効化（履歴保持のため論理削除）
    await supabase
      .from('recurring_reservations')
      .update({ is_active: false })
      .eq('mentor_id', mentorId)
      .eq('is_active', true)

    // メンターレコードを物理削除（FK制約がある場合は論理削除にフォールバック）
    const { error: deleteError } = await supabase
      .from('mentors')
      .delete()
      .eq('id', mentorId)

    if (deleteError) {
      // FK制約エラー等の場合は論理削除
      const { error: updateError } = await supabase
        .from('mentors')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mentorId)

      if (updateError) {
        throw new Error(`メンター削除に失敗: ${updateError.message}`)
      }
    }

    // メンターロールのエントリを削除（admin/managerは維持）
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', mentor.user_id)
      .eq('role', 'mentor')

    revalidatePath('/admin/mentors')
    revalidatePath('/admin/shifts')
    revalidatePath('/admin/recurring')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mentor delete error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'サーバーエラー',
    }, { status: 500 })
  }
}
