import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isAdmin, isMentor } from '@/lib/queries/auth'
import { isValidUUID } from '@/lib/validation'
import { revalidatePath } from 'next/cache'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const admin = await isAdmin(user.id)
    const mentor = await isMentor(user.id)

    let query = adminClient
      .from('exchange_requests')
      .select(`
        *,
        exchange_items (*),
        profiles:user_id (display_name, email)
      `)
      .order('created_at', { ascending: false })

    // 顧客は自分の申請のみ
    if (!admin && !mentor) {
      query = query.eq('user_id', user.id)
    }

    const { url } = request
    const { searchParams } = new URL(url)
    const status = searchParams.get('status')
    const VALID_STATUSES = ['requested', 'ordering', 'completed', 'cancelled']
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: '無効なステータスです' }, { status: 400 })
      }
      query = query.eq('status', status)
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    query = query.limit(limit)

    const { data, error } = await query

    if (error) {
      console.error('Exchange requests fetch error:', error)
      return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ requests: data ?? [] })
  } catch (error) {
    console.error('Exchange requests API error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // ユーザー認証
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // ユーザーステータスチェック
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single()

    if (profile && profile.status !== 'active') {
      return NextResponse.json({ error: 'アカウントが制限されています' }, { status: 403 })
    }

    // リクエストボディ
    let body: { exchangeItemId?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: '無効なリクエスト形式です' }, { status: 400 })
    }

    const { exchangeItemId } = body
    if (!exchangeItemId) {
      return NextResponse.json({ error: '交換アイテムを選択してください' }, { status: 400 })
    }
    if (!isValidUUID(exchangeItemId)) {
      return NextResponse.json({ error: '無効なIDフォーマットです' }, { status: 400 })
    }

    // 交換アイテム確認
    const { data: item, error: itemError } = await adminClient
      .from('exchange_items')
      .select('*')
      .eq('id', exchangeItemId)
      .eq('is_active', true)
      .single()

    if (itemError || !item) {
      return NextResponse.json({ error: '交換アイテムが見つかりません' }, { status: 400 })
    }

    // 残高確認（期限切れを除外）
    const now = new Date().toISOString()
    const { data: ledgers } = await adminClient
      .from('coin_ledgers')
      .select('amount_current')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', now)

    const availableBalance = ledgers?.reduce((sum, l) => sum + l.amount_current, 0) ?? 0

    if (availableBalance < item.coin_cost) {
      return NextResponse.json({
        error: `コインが不足しています（必要: ${item.coin_cost} SC, 残高: ${availableBalance} SC）`
      }, { status: 400 })
    }

    // 1. 交換申請レコードを作成
    const { data: exchangeRequest, error: requestError } = await adminClient
      .from('exchange_requests')
      .insert({
        user_id: user.id,
        exchange_item_id: exchangeItemId,
        coins_locked: item.coin_cost,
        status: 'requested',
      })
      .select()
      .single()

    if (requestError || !exchangeRequest) {
      console.error('Exchange request creation error:', requestError)
      return NextResponse.json({ error: '申請の作成に失敗しました' }, { status: 500 })
    }

    // 2. コインをロック（FIFO順）- ロールバック保護付き
    const lockedUpdates: { id: string; prevCurrent: number; prevLocked: number }[] = []

    try {
      let remainingToLock = item.coin_cost
      const lockNow = new Date().toISOString()

      const { data: activeLedgers } = await adminClient
        .from('coin_ledgers')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('amount_current', 0)
        .gt('expires_at', lockNow)
        .order('expires_at', { ascending: true })
        .order('granted_at', { ascending: true })

      for (const ledger of activeLedgers || []) {
        if (remainingToLock <= 0) break

        const lockAmount = Math.min(ledger.amount_current, remainingToLock)

        // 楽観的ロック: amount_currentが変わっていないことを確認
        const { data: updated, error: lockError } = await adminClient
          .from('coin_ledgers')
          .update({
            amount_current: ledger.amount_current - lockAmount,
            amount_locked: ledger.amount_locked + lockAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', ledger.id)
          .eq('amount_current', ledger.amount_current)
          .select('id')

        if (lockError) throw new Error(`コインロック失敗: ${lockError.message}`)
        if (!updated || updated.length === 0) {
          throw new Error('コインが他の操作で更新されました。もう一度お試しください')
        }

        lockedUpdates.push({
          id: ledger.id,
          prevCurrent: ledger.amount_current,
          prevLocked: ledger.amount_locked,
        })

        remainingToLock -= lockAmount
      }

      if (remainingToLock > 0) {
        throw new Error('コインロック中に残高不足が発生しました')
      }
    } catch (lockErr) {
      // コインロック失敗時: ロールバック
      for (const update of lockedUpdates) {
        await adminClient
          .from('coin_ledgers')
          .update({
            amount_current: update.prevCurrent,
            amount_locked: update.prevLocked,
          })
          .eq('id', update.id)
      }
      // 申請も削除
      await adminClient.from('exchange_requests').delete().eq('id', exchangeRequest.id)
      console.error('Exchange coin lock rollback:', lockErr)
      return NextResponse.json({ error: 'コインのロックに失敗しました。もう一度お試しください' }, { status: 409 })
    }

    // 3. 残高再計算
    const { data: newLedgers } = await adminClient
      .from('coin_ledgers')
      .select('amount_current')
      .eq('user_id', user.id)
      .eq('status', 'active')

    const newBalance = newLedgers?.reduce((sum, l) => sum + l.amount_current, 0) ?? 0

    // 4. 取引履歴に記録
    await adminClient
      .from('coin_transactions')
      .insert({
        user_id: user.id,
        amount: -item.coin_cost,
        balance_after: newBalance,
        type: 'exchange_lock',
        description: `交換ロック: ${item.name}`,
      })

    revalidatePath('/dashboard')
    revalidatePath('/mentor')
    revalidatePath('/admin')

    return NextResponse.json({
      success: true,
      requestId: exchangeRequest.id,
      lockedAmount: item.coin_cost,
      remainingBalance: newBalance,
    })
  } catch (error) {
    console.error('Exchange API error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
