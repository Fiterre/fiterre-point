import { createAdminClient } from '@/lib/supabase/admin'

export interface ExpiringCoin {
  id: string
  user_id: string
  amount_current: number
  amount_locked: number
  expires_at: string
  created_at: string
  profiles: {
    display_name: string | null
    email: string
  }
}

export async function getExpiringCoins(daysUntilExpiry: number = 30) {
  const supabase = createAdminClient()

  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + daysUntilExpiry)

  const { data, error } = await supabase
    .from('coin_ledgers')
    .select(`
      id,
      user_id,
      amount_current,
      amount_locked,
      expires_at,
      created_at,
      profiles:user_id (
        display_name,
        email
      )
    `)
    .eq('status', 'active')
    .gt('amount_current', 0)
    .lte('expires_at', targetDate.toISOString())
    .order('expires_at', { ascending: true })

  if (error) {
    console.error('Error fetching expiring coins:', error)
    return []
  }

  return (data ?? []) as unknown as ExpiringCoin[]
}

export async function extendCoinExpiry(ledgerId: string, additionalDays: number) {
  const supabase = createAdminClient()

  // 現在の期限を取得
  const { data: ledger, error: fetchError } = await supabase
    .from('coin_ledgers')
    .select('expires_at')
    .eq('id', ledgerId)
    .single()

  if (fetchError || !ledger) {
    throw new Error('コイン台帳が見つかりません')
  }

  // 新しい期限を計算
  const currentExpiry = new Date(ledger.expires_at)
  const newExpiry = new Date(currentExpiry)
  newExpiry.setDate(newExpiry.getDate() + additionalDays)

  // 更新
  const { error: updateError } = await supabase
    .from('coin_ledgers')
    .update({
      expires_at: newExpiry.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', ledgerId)

  if (updateError) {
    throw new Error('期限の延長に失敗しました')
  }

  return { newExpiry }
}

export async function bulkExtendExpiry(ledgerIds: string[], additionalDays: number) {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  }

  for (const ledgerId of ledgerIds) {
    try {
      await extendCoinExpiry(ledgerId, additionalDays)
      results.success++
    } catch (error) {
      results.failed++
      results.errors.push(`${ledgerId}: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  return results
}

export async function getExpiryStats() {
  const supabase = createAdminClient()

  const now = new Date()
  const in7Days = new Date(now)
  in7Days.setDate(in7Days.getDate() + 7)
  const in30Days = new Date(now)
  in30Days.setDate(in30Days.getDate() + 30)

  // 7日以内に期限切れ
  const { data: within7, count: count7 } = await supabase
    .from('coin_ledgers')
    .select('amount_current', { count: 'exact' })
    .eq('status', 'active')
    .gt('amount_current', 0)
    .lte('expires_at', in7Days.toISOString())

  // 30日以内に期限切れ
  const { data: within30, count: count30 } = await supabase
    .from('coin_ledgers')
    .select('amount_current', { count: 'exact' })
    .eq('status', 'active')
    .gt('amount_current', 0)
    .lte('expires_at', in30Days.toISOString())

  const amount7 = within7?.reduce((sum, l) => sum + l.amount_current, 0) ?? 0
  const amount30 = within30?.reduce((sum, l) => sum + l.amount_current, 0) ?? 0

  return {
    within7Days: { count: count7 ?? 0, amount: amount7 },
    within30Days: { count: count30 ?? 0, amount: amount30 }
  }
}
