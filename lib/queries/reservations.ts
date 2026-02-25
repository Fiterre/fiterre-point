import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getSessionTypes() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('session_types')
    .select('*')
    .eq('is_active', true)
    .order('display_order')

  if (error) {
    console.error('Error fetching session types:', error)
    return []
  }

  return data ?? []
}

// ユーザー向け: アクティブメンターのみ（アカウント停止プロファイルを除外）
export async function getMentors() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('mentors')
    .select(`
      *,
      profiles:user_id (
        display_name,
        status
      )
    `)
    .eq('is_active', true)
    .order('created_at')

  if (error) {
    console.error('Error fetching mentors:', error)
    return []
  }

  // アカウント停止・削除済みプロファイルのメンターを除外
  return (data ?? []).filter(m => {
    const profile = m.profiles as { display_name: string; status: string } | null
    return profile?.status === 'active'
  })
}

// 管理者向け: 全メンター（active/inactive）
export async function getAllMentors() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('mentors')
    .select(`
      *,
      profiles:user_id (
        display_name,
        email
      )
    `)
    .order('is_active', { ascending: false })
    .order('created_at')

  if (error) {
    console.error('Error fetching all mentors:', error)
    return []
  }

  return data ?? []
}

export async function getUserReservations(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      mentors (
        id,
        user_id,
        profiles:user_id (
          display_name
        )
      )
    `)
    .eq('user_id', userId)
    .order('reserved_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching reservations:', error)
    return []
  }

  return data ?? []
}

export async function getUpcomingReservations(userId: string) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      mentors (
        id,
        user_id,
        profiles:user_id (
          display_name
        )
      )
    `)
    .eq('user_id', userId)
    .gte('reserved_at', today)
    .in('status', ['pending', 'confirmed'])
    .order('reserved_at')
    .limit(5)

  if (error) {
    console.error('Error fetching upcoming reservations:', error)
    return []
  }

  return data ?? []
}

// 管理者向け: 本日の予約件数
export async function getTodayReservationCount() {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { count, error } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .gte('reserved_at', `${today}T00:00:00`)
    .lte('reserved_at', `${today}T23:59:59`)
    .in('status', ['pending', 'confirmed'])
    .eq('is_blocked', false)

  if (error) {
    console.error('Error fetching today reservation count:', error)
    return 0
  }

  return count ?? 0
}

// メンター向け: 本日の自分の予約一覧
export async function getMentorTodayReservations(mentorId: string) {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      profiles:user_id (
        display_name
      )
    `)
    .eq('mentor_id', mentorId)
    .gte('reserved_at', `${today}T00:00:00`)
    .lte('reserved_at', `${today}T23:59:59`)
    .in('status', ['pending', 'confirmed'])
    .eq('is_blocked', false)
    .order('reserved_at')

  if (error) {
    console.error('Error fetching mentor today reservations:', error)
    return []
  }

  return data ?? []
}
