import { createAdminClient } from '@/lib/supabase/admin'

export interface TransactionFilter {
  type?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
}

export async function getAllTransactions(
  limit: number = 100,
  offset: number = 0,
  filter?: TransactionFilter
) {
  const supabase = createAdminClient()

  let query = supabase
    .from('coin_transactions')
    .select(`
      *,
      profiles:user_id (
        display_name,
        email
      ),
      executor:executed_by (
        display_name,
        email
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (filter?.type) {
    query = query.eq('type', filter.type)
  }

  if (filter?.userId) {
    query = query.eq('user_id', filter.userId)
  }

  if (filter?.dateFrom) {
    query = query.gte('created_at', filter.dateFrom)
  }

  if (filter?.dateTo) {
    query = query.lte('created_at', filter.dateTo + 'T23:59:59')
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching transactions:', error)
    return { data: [], count: 0 }
  }

  return { data: data ?? [], count: count ?? 0 }
}

export async function getTransactionStats() {
  const supabase = createAdminClient()

  // 今月の開始日
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // 今月の付与総額
  const { data: granted } = await supabase
    .from('coin_transactions')
    .select('amount')
    .gte('created_at', monthStart)
    .gt('amount', 0)

  // 今月の消費総額
  const { data: spent } = await supabase
    .from('coin_transactions')
    .select('amount')
    .gte('created_at', monthStart)
    .lt('amount', 0)

  const totalGranted = granted?.reduce((sum, t) => sum + t.amount, 0) ?? 0
  const totalSpent = Math.abs(spent?.reduce((sum, t) => sum + t.amount, 0) ?? 0)

  return {
    monthlyGranted: totalGranted,
    monthlySpent: totalSpent,
    monthlyNet: totalGranted - totalSpent
  }
}
