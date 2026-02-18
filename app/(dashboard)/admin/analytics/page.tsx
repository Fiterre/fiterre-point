export const dynamic = 'force-dynamic'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TrendingUp,
  Users,
  Coins,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { getAnalyticsData } from '@/lib/queries/analytics'
import ReservationChart from '@/components/features/admin/analytics/ReservationChart'
import MentorStatsTable from '@/components/features/admin/analytics/MentorStatsTable'
import CoinFlowChart from '@/components/features/admin/analytics/CoinFlowChart'

export default async function AdminAnalyticsPage() {
  const analytics = await getAnalyticsData()

  const statCards = [
    {
      title: '今月の予約数',
      value: analytics.monthlyReservations,
      change: analytics.reservationChange,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'アクティブ会員',
      value: analytics.activeUsers,
      change: analytics.userChange,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10'
    },
    {
      title: '今月のコイン付与',
      value: `${analytics.monthlyCoinsGranted.toLocaleString()} SC`,
      change: analytics.coinsGrantedChange,
      icon: Coins,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: '今月のコイン消費',
      value: `${analytics.monthlyCoinsSpent.toLocaleString()} SC`,
      change: analytics.coinsSpentChange,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">分析ダッシュボード</h1>
        <p className="text-muted-foreground">売上・予約・メンターのパフォーマンスを確認</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    {stat.change >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change >= 0 ? '+' : ''}{stat.change}%
                    </span>
                    <span className="text-sm text-muted-foreground/70 ml-1">先月比</span>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* グラフエリア */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 予約数推移 */}
        <Card>
          <CardHeader>
            <CardTitle>予約数推移（過去30日）</CardTitle>
          </CardHeader>
          <CardContent>
            <ReservationChart data={analytics.reservationTrend} />
          </CardContent>
        </Card>

        {/* コインフロー */}
        <Card>
          <CardHeader>
            <CardTitle>コインフロー（過去30日）</CardTitle>
          </CardHeader>
          <CardContent>
            <CoinFlowChart data={analytics.coinFlowTrend} />
          </CardContent>
        </Card>
      </div>

      {/* メンター別統計 */}
      <Card>
        <CardHeader>
          <CardTitle>メンター別パフォーマンス</CardTitle>
        </CardHeader>
        <CardContent>
          <MentorStatsTable stats={analytics.mentorStats} />
        </CardContent>
      </Card>
    </div>
  )
}
