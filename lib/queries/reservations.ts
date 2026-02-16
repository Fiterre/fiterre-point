import { createClient } from '@/lib/supabase/server'

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

export async function getMentors() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mentors')
    .select(`
      *,
      profiles (
        display_name
      )
    `)
    .eq('is_active', true)
    .order('created_at')

  if (error) {
    console.error('Error fetching mentors:', error)
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
        profiles (
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
        profiles (
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
