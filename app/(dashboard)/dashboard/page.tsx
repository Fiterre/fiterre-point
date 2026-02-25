export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserBalance } from '@/lib/queries/balance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, History, Award, QrCode, Settings } from 'lucide-react'
import BalanceCard from '@/components/features/dashboard/BalanceCard'
import GradeCard3D from '@/components/features/dashboard/GradeCard3D'
import { getCoinRankings, getUserRankPosition } from '@/lib/queries/rankings'
import { getUpcomingReservations } from '@/lib/queries/reservations'
import CoinRankingCard from '@/components/features/dashboard/CoinRankingCard'
import Link from 'next/link'
import type { MemberRank } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ユーザーの残高・プロフィールを取得
  const balance = user ? await getUserBalance(user.id) : { available: 0, locked: 0, total: 0 }

  const [rankings, userPosition, profileRes] = await Promise.all([
    getCoinRankings(5),
    user ? getUserRankPosition(user.id) : Promise.resolve(null),
    user
      ? supabase.from('profiles').select('display_name, rank, created_at').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
  ])
  const profile = profileRes.data
  const upcomingReservations = user ? await getUpcomingReservations(user.id) : []

  // 直近48h以内に合格した Fitest があれば rankUpKey を渡す（昇格アニメーション用）
  let rankUpKey: string | undefined
  if (user && profile?.rank && profile.rank !== 'bronze') {
    const adminClient = createAdminClient()
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const RANK_FROM_LEVEL: Record<string, string> = {
      intermediate: 'silver',
      advanced: 'gold',
      master: 'diamond',
    }
    const { data: recentPromotion } = await adminClient
      .from('fitest_results')
      .select('id, target_level')
      .eq('user_id', user.id)
      .eq('passed', true)
      .gt('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (recentPromotion && RANK_FROM_LEVEL[recentPromotion.target_level] === profile.rank) {
      rankUpKey = recentPromotion.id
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">ダッシュボード</h2>
        <p className="text-muted-foreground">ようこそ、{user?.email} さん</p>
      </div>

      {/* 3Dグレードカード */}
      {profile && (
        <GradeCard3D
          rank={(profile.rank as MemberRank) ?? 'bronze'}
          displayName={profile.display_name}
          memberSince={profile.created_at}
          rankUpKey={rankUpKey}
        />
      )}

      {/* コイン残高カード */}
      <BalanceCard
        available={balance.available}
        locked={balance.locked}
        total={balance.total}
      />

      {/* クイックアクション */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/reservations">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-primary/10 rounded-full">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">予約する</h3>
                <p className="text-sm text-muted-foreground">トレーニングを予約</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/history">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-primary/10 rounded-full">
                <History className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">履歴を見る</h3>
                <p className="text-sm text-muted-foreground">取引履歴を確認</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/fitest">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-primary/10 rounded-full">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Fitest</h3>
                <p className="text-sm text-muted-foreground">昇格試験の記録</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/checkin">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-primary/10 rounded-full">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">チェックイン</h3>
                <p className="text-sm text-muted-foreground">来店コード表示</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/settings">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-muted rounded-full">
                <Settings className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">設定</h3>
                <p className="text-sm text-muted-foreground">LINE連携・通知設定</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 直近の予約 */}
      <Card>
        <CardHeader>
          <CardTitle>直近の予約</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingReservations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              予約がありません
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingReservations.map((res) => {
                const mentorProfile = (res.mentors as unknown as { id: string; user_id: string; profiles: { display_name: string }[] } | null)
                const mentorName = mentorProfile?.profiles?.[0]?.display_name ?? 'メンター'
                const reservedAt = new Date(res.reserved_at)
                return (
                  <div key={res.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">
                        {reservedAt.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' })}
                        {' '}
                        {reservedAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-sm text-muted-foreground">担当: {mentorName}</p>
                    </div>
                    <div className="text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${res.status === 'confirmed' ? 'bg-green-500/10 text-green-700' : 'bg-yellow-500/10 text-yellow-700'}`}>
                        {res.status === 'confirmed' ? '確定' : '未確定'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* コインランキング */}
      <CoinRankingCard
        rankings={rankings}
        currentUserId={user?.id}
      />

      {userPosition && (
        <p className="text-sm text-center text-muted-foreground">
          あなたの順位: {userPosition}位
        </p>
      )}
    </div>
  )
}
