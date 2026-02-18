export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/queries/auth'
import { getRecentCheckIns, getTodayCheckInCount } from '@/lib/queries/checkIn'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCheck, Users, Clock } from 'lucide-react'
import CheckInForm from '@/components/features/checkin/CheckInForm'
import RecentCheckInsList from '@/components/features/checkin/RecentCheckInsList'

export default async function MentorCheckInPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const [recentCheckIns, todayCount] = await Promise.all([
    getRecentCheckIns(10),
    getTodayCheckInCount()
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">チェックイン</h1>
        <p className="text-muted-foreground">来店されたお客様のチェックイン処理</p>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-700">本日のチェックイン</p>
                <p className="text-3xl font-bold text-green-800">{todayCount}名</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">現在時刻</p>
                <p className="text-2xl font-bold" suppressHydrationWarning>
                  {new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* チェックインフォーム */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            コード入力でチェックイン
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CheckInForm mentorId={user.id} />
        </CardContent>
      </Card>

      {/* 最近のチェックイン */}
      <Card>
        <CardHeader>
          <CardTitle>最近のチェックイン</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentCheckInsList checkIns={recentCheckIns} />
        </CardContent>
      </Card>
    </div>
  )
}
