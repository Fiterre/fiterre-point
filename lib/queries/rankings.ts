import { createAdminClient } from '@/lib/supabase/admin'

export interface CoinRanking {
  userId: string
  displayName: string
  email: string
  rank: string
  totalCoins: number
  position: number
}

export async function getCoinRankings(limit: number = 10): Promise<CoinRanking[]> {
  const supabase = createAdminClient()

  // 全ユーザーのコイン残高を取得（アクティブなレジャーのみ、期限切れ除外）
  const { data: ledgers, error } = await supabase
    .from('coin_ledgers')
    .select(`
      user_id,
      amount_current,
      amount_locked,
      profiles:user_id (
        display_name,
        email,
        rank,
        status
      )
    `)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())

  if (error) {
    console.error('Error fetching rankings:', error)
    return []
  }

  // ユーザーごとに集計（非アクティブアカウントを除外）
  const userTotals: Record<string, {
    displayName: string
    email: string
    rank: string
    totalCoins: number
  }> = {}

  ledgers?.forEach(ledger => {
    const userId = ledger.user_id
    const profile = ledger.profiles as any

    // アカウント停止・削除済みユーザーをランキングから除外
    if (profile?.status && profile.status !== 'active') return

    if (!userTotals[userId]) {
      userTotals[userId] = {
        displayName: profile?.display_name || '名前未設定',
        email: profile?.email || '',
        rank: profile?.rank || 'bronze',
        totalCoins: 0
      }
    }

    userTotals[userId].totalCoins += (ledger.amount_current || 0) + (ledger.amount_locked || 0)
  })

  // ランキング作成
  const rankings = Object.entries(userTotals)
    .map(([userId, data]) => ({
      userId,
      ...data
    }))
    .sort((a, b) => b.totalCoins - a.totalCoins)
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      position: index + 1
    }))

  return rankings
}

export async function getUserRankPosition(userId: string): Promise<number | null> {
  const rankings = await getCoinRankings(10000)
  const userRank = rankings.find(r => r.userId === userId)
  return userRank?.position || null
}
