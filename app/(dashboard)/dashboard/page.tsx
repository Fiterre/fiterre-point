import { createClient } from '@/lib/supabase/server'
import { getUserBalance } from '@/lib/queries/balance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, History, Award, QrCode, Settings } from 'lucide-react'
import BalanceCard from '@/components/features/dashboard/BalanceCard'
import { getCoinRankings, getUserRankPosition } from '@/lib/queries/rankings'
import CoinRankingCard from '@/components/features/dashboard/CoinRankingCard'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ユーザーの残高を取得
  const balance = user ? await getUserBalance(user.id) : { available: 0, locked: 0, total: 0 }

  const [rankings, userPosition] = await Promise.all([
    getCoinRankings(5),
    user ? getUserRankPosition(user.id) : Promise.resolve(null)
  ])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">ダッシュボード</h2>
        <p className="text-gray-600">ようこそ、{user?.email} さん</p>
      </div>

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
              <div className="p-3 bg-amber-100 rounded-full">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold">予約する</h3>
                <p className="text-sm text-gray-600">トレーニングを予約</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/history">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-amber-100 rounded-full">
                <History className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold">履歴を見る</h3>
                <p className="text-sm text-gray-600">取引履歴を確認</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/fitest">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-amber-100 rounded-full">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold">Fitest</h3>
                <p className="text-sm text-gray-600">昇格試験の記録</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/checkin">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-amber-100 rounded-full">
                <QrCode className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold">チェックイン</h3>
                <p className="text-sm text-gray-600">来店コード表示</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/settings">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-gray-100 rounded-full">
                <Settings className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold">設定</h3>
                <p className="text-sm text-gray-600">LINE連携・通知設定</p>
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
          <p className="text-gray-500 text-center py-8">
            予約がありません
          </p>
        </CardContent>
      </Card>

      {/* コインランキング */}
      <CoinRankingCard
        rankings={rankings}
        currentUserId={user?.id}
      />

      {userPosition && (
        <p className="text-sm text-center text-gray-500">
          あなたの順位: {userPosition}位
        </p>
      )}
    </div>
  )
}
