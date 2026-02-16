import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { TierPermissions } from '@/types/database'

export async function getUserTier(userId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      role,
      tier_id,
      role_tiers (
        tier_level,
        tier_name,
        permissions
      )
    `)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return null
  }

  const tier = (data as any).role_tiers as { tier_level: number; tier_name: string; permissions: TierPermissions } | null

  return {
    role: data.role,
    tier_id: data.tier_id,
    tier
  }
}

export async function getUserPermissions(userId: string): Promise<TierPermissions | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      role,
      role_tiers (
        permissions
      )
    `)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return null
  }

  // adminは常に全権限
  if (data.role === 'admin') {
    return {
      users: { view: true, edit: true, delete: true },
      coins: { view: true, grant: true, adjust: true },
      mentors: { view: true, edit: true, manage_all: true },
      shifts: { view: true, edit_own: true, edit_all: true },
      reservations: { view_all: true, edit_all: true, cancel: true },
      recurring: { view: true, edit: true, execute: true },
      fitest: { view: true, input: true, manage: true },
      records: { view_all: true, edit_all: true },
      settings: { view: true, edit: true },
      analytics: { view: true }
    }
  }

  // Tierがあればその権限を返す
  const tier = (data as any).role_tiers as { permissions: TierPermissions } | null
  if (tier?.permissions) {
    return tier.permissions as TierPermissions
  }

  // デフォルト（user）は最小権限
  return {
    users: { view: false, edit: false, delete: false },
    coins: { view: false, grant: false, adjust: false },
    mentors: { view: false, edit: false, manage_all: false },
    shifts: { view: false, edit_own: false, edit_all: false },
    reservations: { view_own: true, edit_own: false, cancel: false },
    recurring: { view: false, edit: false, execute: false },
    fitest: { view: false, input: false, manage: false },
    records: { view_own: true, edit_own: false },
    settings: { view: false, edit: false },
    analytics: { view: false }
  }
}

export async function checkPermission(
  userId: string,
  category: keyof TierPermissions,
  action: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  if (!permissions) return false

  const categoryPerms = permissions[category] as Record<string, boolean>
  return categoryPerms?.[action] === true
}

export async function getAllTiers() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('role_tiers')
    .select('*')
    .eq('is_active', true)
    .order('tier_level', { ascending: true })

  if (error) {
    console.error('Error fetching tiers:', error)
    return []
  }

  return data ?? []
}
