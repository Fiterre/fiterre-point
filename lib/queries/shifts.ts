import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 曜日の日本語ラベル
export const DAY_OF_WEEK_LABELS = ['日', '月', '火', '水', '木', '金', '土']

export async function getTrainerShifts(trainerId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('trainer_shifts')
    .select(`
      *,
      trainers (
        id,
        profiles (
          display_name
        )
      )
    `)
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time')

  if (trainerId) {
    query = query.eq('trainer_id', trainerId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching shifts:', error)
    return []
  }

  return data ?? []
}

export async function getAvailableTrainers(dayOfWeek: number, time: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trainer_shifts')
    .select(`
      trainer_id,
      trainers (
        id,
        specialty,
        profiles (
          display_name
        )
      )
    `)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .lte('start_time', time)
    .gte('end_time', time)

  if (error) {
    console.error('Error fetching available trainers:', error)
    return []
  }

  // 重複を除去
  const uniqueTrainers = data?.reduce((acc, shift) => {
    if (shift.trainers && !acc.find(t => t.id === shift.trainers.id)) {
      acc.push(shift.trainers)
    }
    return acc
  }, [] as any[])

  return uniqueTrainers ?? []
}

export async function getRecurringReservations() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('recurring_reservations')
    .select(`
      *,
      profiles (
        display_name,
        email
      ),
      trainers (
        profiles (
          display_name
        )
      ),
      session_types (
        name,
        coin_cost
      )
    `)
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time')

  if (error) {
    console.error('Error fetching recurring reservations:', error)
    return []
  }

  return data ?? []
}

export async function getNextTriggerDate() {
  // 次の28日を計算
  const now = new Date()
  let targetDate = new Date(now.getFullYear(), now.getMonth(), 28)

  if (now.getDate() >= 28) {
    // 今月の28日を過ぎていたら来月の28日
    targetDate = new Date(now.getFullYear(), now.getMonth() + 1, 28)
  }

  const diffTime = targetDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return {
    date: targetDate,
    daysRemaining: diffDays
  }
}
