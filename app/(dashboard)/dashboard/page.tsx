import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Coins, Calendar, History } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">ダッシュボード</h2>
        <p className="text-gray-600">ようこそ、{user?.email} さん</p>
      </div>

      {/* コイン残高カード */}
      <Card className="bg-gradient-to-br from-amber-400 to-amber-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-6 w-6" />
            コイン残高
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">0 SC</div>
          <div className="text-amber-100 mt-2">
            <span className="text-sm">ロック中: 0 SC</span>
          </div>
        </CardContent>
      </Card>

      {/* クイックアクション */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      {/* プレースホルダー: 直近の予約 */}
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
    </div>
  )
}
