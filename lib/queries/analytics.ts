import { createAdminClient } from '@/lib/supabase/admin'

export interface AnalyticsData {
  monthlyReservations: number
  reservationChange: number
  activeUsers: number
  userChange: number
  monthlyCoinsGranted: number
  coinsGrantedChange: number
  monthlyCoinsSpent: number
  coinsSpentChange: number
  reservationTrend: { date: string; count: number }[]
  coinFlowTrend: { date: string; granted: number; spent: number }[]
  mentorStats: MentorStat[]
}

export interface MentorStat {
  mentorId: string
  mentorName: string
  totalSessions: number
  totalCustomers: number
  totalCoins: number
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const supabase = createAdminClient()

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // 今月の予約数
  const { count: thisMonthReservations } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thisMonthStart)

  // 先月の予約数
  const { count: lastMonthReservations } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', lastMonthStart)
    .lt('created_at', thisMonthStart)

  // アクティブユーザー数
  const { count: activeUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // 先月のアクティブユーザー（簡易計算）
  const lastMonthActiveUsers = Math.round((activeUsers || 0) * 0.95)

  // 今月のコイン付与
  const { data: thisMonthGranted } = await supabase
    .from('coin_transactions')
    .select('amount')
    .gte('created_at', thisMonthStart)
    .gt('amount', 0)

  const monthlyCoinsGranted = thisMonthGranted?.reduce((sum, t) => sum + t.amount, 0) || 0

  // 先月のコイン付与
  const { data: lastMonthGranted } = await supabase
    .from('coin_transactions')
    .select('amount')
    .gte('created_at', lastMonthStart)
    .lt('created_at', thisMonthStart)
    .gt('amount', 0)

  const lastMonthCoinsGranted = lastMonthGranted?.reduce((sum, t) => sum + t.amount, 0) || 0

  // 今月のコイン消費
  const { data: thisMonthSpent } = await supabase
    .from('coin_transactions')
    .select('amount')
    .gte('created_at', thisMonthStart)
    .lt('amount', 0)

  const monthlyCoinsSpent = Math.abs(thisMonthSpent?.reduce((sum, t) => sum + t.amount, 0) || 0)

  // 先月のコイン消費
  const { data: lastMonthSpent } = await supabase
    .from('coin_transactions')
    .select('amount')
    .gte('created_at', lastMonthStart)
    .lt('created_at', thisMonthStart)
    .lt('amount', 0)

  const lastMonthCoinsSpent = Math.abs(lastMonthSpent?.reduce((sum, t) => sum + t.amount, 0) || 0)

  // 予約数推移（過去30日）
  const { data: reservationTrendData } = await supabase
    .from('reservations')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at')

  const reservationTrend = aggregateByDate(reservationTrendData || [], 'created_at')

  // コインフロー推移（過去30日）
  const { data: coinFlowData } = await supabase
    .from('coin_transactions')
    .select('amount, created_at')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at')

  const coinFlowTrend = aggregateCoinFlow(coinFlowData || [])

  // メンター別統計
  const { data: mentorStatsData } = await supabase
    .from('reservations')
    .select(`
      mentor_id,
      coins_used,
      user_id,
      mentors:mentor_id (
        profiles:user_id (
          display_name
        )
      )
    `)
    .gte('created_at', thisMonthStart)

  const mentorStats = aggregateMentorStats(mentorStatsData || [])

  // 変化率計算
  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  return {
    monthlyReservations: thisMonthReservations || 0,
    reservationChange: calcChange(thisMonthReservations || 0, lastMonthReservations || 0),
    activeUsers: activeUsers || 0,
    userChange: calcChange(activeUsers || 0, lastMonthActiveUsers),
    monthlyCoinsGranted,
    coinsGrantedChange: calcChange(monthlyCoinsGranted, lastMonthCoinsGranted),
    monthlyCoinsSpent,
    coinsSpentChange: calcChange(monthlyCoinsSpent, lastMonthCoinsSpent),
    reservationTrend,
    coinFlowTrend,
    mentorStats
  }
}

function aggregateByDate(data: { created_at: string }[], field: string) {
  const counts: Record<string, number> = {}

  // 過去30日分の日付を初期化
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    counts[dateStr] = 0
  }

  data.forEach(item => {
    const date = new Date(item[field as keyof typeof item] as string).toISOString().split('T')[0]
    if (counts[date] !== undefined) {
      counts[date]++
    }
  })

  return Object.entries(counts).map(([date, count]) => ({ date, count }))
}

function aggregateCoinFlow(data: { amount: number; created_at: string }[]) {
  const flow: Record<string, { granted: number; spent: number }> = {}

  // 過去30日分の日付を初期化
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    flow[dateStr] = { granted: 0, spent: 0 }
  }

  data.forEach(item => {
    const date = new Date(item.created_at).toISOString().split('T')[0]
    if (flow[date]) {
      if (item.amount > 0) {
        flow[date].granted += item.amount
      } else {
        flow[date].spent += Math.abs(item.amount)
      }
    }
  })

  return Object.entries(flow).map(([date, values]) => ({ date, ...values }))
}

function aggregateMentorStats(data: any[]): MentorStat[] {
  const stats: Record<string, MentorStat> = {}

  data.forEach(item => {
    const mentorId = item.mentor_id
    if (!mentorId) return

    if (!stats[mentorId]) {
      stats[mentorId] = {
        mentorId,
        mentorName: item.mentors?.profiles?.display_name || '名前未設定',
        totalSessions: 0,
        totalCustomers: 0,
        totalCoins: 0
      }
    }

    stats[mentorId].totalSessions++
    stats[mentorId].totalCoins += item.coins_used || 0
  })

  // ユニーク顧客数をカウント
  const customersByMentor: Record<string, Set<string>> = {}
  data.forEach(item => {
    const mentorId = item.mentor_id
    if (!mentorId) return
    if (!customersByMentor[mentorId]) {
      customersByMentor[mentorId] = new Set()
    }
    customersByMentor[mentorId].add(item.user_id)
  })

  Object.keys(stats).forEach(mentorId => {
    stats[mentorId].totalCustomers = customersByMentor[mentorId]?.size || 0
  })

  return Object.values(stats).sort((a, b) => b.totalSessions - a.totalSessions)
}
