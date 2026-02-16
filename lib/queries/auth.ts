import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserTier, checkPermission } from './permissions'
import { TierPermissions } from '@/types/database'

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

export async function isMentor(userId: string) {
  const role = await getUserRole(userId)
  return role === 'admin' || role === 'manager' || role === 'mentor'
}

// Tier レベルでの権限チェック（数字が小さいほど権限が高い）
export async function hasMinimumTier(userId: string, requiredTier: number): Promise<boolean> {
  const userTier = await getUserTier(userId)

  if (!userTier || !userTier.tier) {
    // Tierが設定されていない場合、roleで判断
    if (userTier?.role === 'admin') return true
    if (userTier?.role === 'manager') return requiredTier >= 2
    return false
  }

  return userTier.tier.tier_level <= requiredTier
}

// 特定の権限を持っているかチェック
export async function canAccess(
  userId: string,
  category: keyof TierPermissions,
  action: string
): Promise<boolean> {
  return checkPermission(userId, category, action)
}
