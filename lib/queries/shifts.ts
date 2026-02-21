import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 曜日の日本語ラベル
export const DAY_OF_WEEK_LABELS = ['日', '月', '火', '水', '木', '金', '土']

export async function getMentorShifts(mentorId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('mentor_shifts')
    .select(`
      *,
      mentors (
        id,
        profiles:user_id (
          display_name
        )
      )
    `)
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time')

  if (mentorId) {
    query = query.eq('mentor_id', mentorId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching shifts:', error)
    return []
  }

  return data ?? []
}

export async function getAvailableMentors(dayOfWeek: number, time: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mentor_shifts')
    .select(`
      mentor_id,
      mentors (
        id,
        name,
        profiles:user_id (
          display_name
        )
      )
    `)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .lte('start_time', time)
    .gt('end_time', time)

  if (error) {
    console.error('Error fetching available mentors:', error)
    return []
  }

  // 重複を除去
  const uniqueMentors = data?.reduce((acc, shift) => {
    const mentor = shift.mentors as unknown as { id: string; name: string; profiles: { display_name: string }[] } | null
    if (mentor && !acc.find(t => t.id === mentor.id)) {
      acc.push(mentor)
    }
    return acc
  }, [] as any[])

  return uniqueMentors ?? []
}

export async function getUserRecurringReservations(userId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('recurring_reservations')
    .select(`
      *,
      mentors (
        profiles:user_id (
          display_name
        )
      ),
      session_types (
        name,
        coin_cost
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time')

  if (error) {
    console.error('Error fetching user recurring reservations:', error)
    return []
  }

  return data ?? []
}

export async function getRecurringReservations() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('recurring_reservations')
    .select(`
      *,
      profiles:user_id (
        display_name,
        email
      ),
      mentors (
        profiles:user_id (
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

export async function getTriggerStatus() {
  const supabase = createAdminClient()

  // アクティブな固定予約の件数
  const { count: activeCount } = await supabase
    .from('recurring_reservations')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // 最新の実行ログ（.maybeSingle()でログ0件時もエラーにしない）
  const { data: latestLog, error: logError } = await supabase
    .from('recurring_reservation_logs')
    .select('created_at, status')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (logError) {
    console.error('Error fetching latest log:', logError)
  }

  // 直近の実行結果サマリ（最新日のログを集計）
  let lastRunStats: { created: number; skipped: number; failed: number } | null = null

  if (latestLog) {
    const logDate = latestLog.created_at.split('T')[0]

    const { data: dayLogs, error: dayLogsError } = await supabase
      .from('recurring_reservation_logs')
      .select('status')
      .gte('created_at', `${logDate}T00:00:00`)
      .lte('created_at', `${logDate}T23:59:59`)

    if (dayLogsError) {
      console.error('Error fetching day logs:', dayLogsError)
    }

    if (dayLogs) {
      lastRunStats = {
        created: dayLogs.filter(l => l.status === 'created').length,
        skipped: dayLogs.filter(l => l.status === 'skipped').length,
        failed: dayLogs.filter(l => l.status === 'failed').length,
      }
    }
  }

  return {
    activeRecurringCount: activeCount || 0,
    lastRunAt: latestLog?.created_at || null,
    lastRunStats,
  }
}
