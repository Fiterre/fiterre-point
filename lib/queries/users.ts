import { createAdminClient } from '@/lib/supabase/admin'

export async function getAllUsers() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      user_roles (role)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return data ?? []
}

export async function getUserById(userId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      user_roles (role)
    `)
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }

  return data
}

export async function getUserBalanceAdmin(userId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('coin_ledgers')
    .select('amount_current, amount_locked')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (error) {
    console.error('Error fetching balance:', error)
    return { available: 0, locked: 0, total: 0 }
  }

  const available = data?.reduce((sum, ledger) => sum + ledger.amount_current, 0) ?? 0
  const locked = data?.reduce((sum, ledger) => sum + ledger.amount_locked, 0) ?? 0

  return {
    available,
    locked,
    total: available + locked
  }
}
