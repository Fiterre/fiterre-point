import { createClient } from '@/lib/supabase/server'

export async function getUserBalance(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('coin_ledgers')
    .select('amount_current, amount_locked')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (error) {
    console.error('Error fetching balance:', error)
    return {
      available: 0,
      locked: 0,
      total: 0
    }
  }

  const available = data?.reduce((sum, ledger) => sum + ledger.amount_current, 0) ?? 0
  const locked = data?.reduce((sum, ledger) => sum + ledger.amount_locked, 0) ?? 0

  return {
    available,
    locked,
    total: available + locked
  }
}

export async function getUserTransactions(userId: string, limit: number = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('coin_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching transactions:', error)
    return []
  }

  return data ?? []
}
