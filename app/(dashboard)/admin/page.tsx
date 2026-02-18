import { getAllUsers } from '@/lib/queries/users'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Coins, Calendar, TrendingUp } from 'lucide-react'
import { getCoinRankings } from '@/lib/queries/rankings'
import CoinRankingCard from '@/components/features/dashboard/CoinRankingCard'

export default async function AdminDashboardPage() {
  const users = await getAllUsers()
  const rankings = await getCoinRankings(5)

  const stats = [
    {
      label: '総ユーザー数',
      value: users.length,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: '今月の新規',
      value: users.filter(u => {
        const created = new Date(u.created_at)
        const now = new Date()
        return created.getMonth() === now.getMonth() &&
               created.getFullYear() === now.getFullYear()
      }).length,
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      label: 'アクティブ会員',
      value: users.filter(u => u.status === 'active').length,
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: '本日の予約',
      value: 0,
      icon: Coins,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">管理者ダッシュボード</h1>
        <p className="text-muted-foreground">システムの概要を確認できます</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 最近のユーザー */}
      <Card>
        <CardHeader>
          <CardTitle>最近登録したユーザー</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">ユーザーがいません</p>
          ) : (
            <div className="space-y-3">
              {users.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{user.display_name || '名前未設定'}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('ja-JP')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* コインランキング */}
      <CoinRankingCard rankings={rankings} showViewAll />
    </div>
  )
}
