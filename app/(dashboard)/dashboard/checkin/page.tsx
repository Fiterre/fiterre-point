export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/queries/auth'
import { getUserCheckIns } from '@/lib/queries/checkIn'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { History, Gift } from 'lucide-react'
import CheckInCodeDisplay from '@/components/features/checkin/CheckInCodeDisplay'
import UserCheckInHistory from '@/components/features/checkin/UserCheckInHistory'

export default async function UserCheckInPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const checkIns = await getUserCheckIns(user.id, 20)
  const totalBonusCoins = checkIns.reduce((sum, c) => sum + (c.bonus_coins_granted || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">チェックイン</h1>
        <p className="text-muted-foreground">来店時にこのコードをスタッフに提示してください</p>
      </div>

      {/* コード表示 */}
      <CheckInCodeDisplay userId={user.id} />

      {/* 統計 */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-full">
                <History className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">累計来店回数</p>
                <p className="text-2xl font-bold">{checkIns.length}回</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">獲得来店ポイント</p>
                <p className="text-2xl font-bold text-primary">{totalBonusCoins.toLocaleString()} SC</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 来店履歴 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            来店履歴
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UserCheckInHistory checkIns={checkIns} />
        </CardContent>
      </Card>
    </div>
  )
}
