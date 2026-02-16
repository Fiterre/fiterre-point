import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserRole(userId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return 'user'
  }

  return data.role
}

export async function isAdmin(userId: string) {
  const role = await getUserRole(userId)
  return role === 'admin' || role === 'manager'
}

export async function isTrainer(userId: string) {
  const role = await getUserRole(userId)
  return role === 'admin' || role === 'manager' || role === 'trainer'
}
