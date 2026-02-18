export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/queries/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, Users } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function MentorReservationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = createAdminClient()

  // メンターIDを取得
  const { data: mentor } = await supabase
    .from('mentors')
    .select('id')
    .eq('user_id', user.id)
    .single()

  // 今日の予約を取得
  const today = new Date().toISOString().split('T')[0]
  const { data: todayReservations } = await supabase
    .from('reservations')
    .select(`
      *,
      profiles:user_id (
        display_name,
        email
      )
    `)
    .eq('mentor_id', mentor?.id || '')
    .gte('reserved_at', `${today}T00:00:00`)
    .lt('reserved_at', `${today}T23:59:59`)
    .order('reserved_at')

  // 今後の予約を取得
  const { data: upcomingReservations } = await supabase
    .from('reservations')
    .select(`
      *,
      profiles:user_id (
        display_name,
        email
      )
    `)
    .eq('mentor_id', mentor?.id || '')
    .gt('reserved_at', `${today}T23:59:59`)
    .eq('status', 'confirmed')
    .order('reserved_at')
    .limit(10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">予約管理</h1>
        <p className="text-muted-foreground">あなたの担当する予約を確認</p>
      </div>

      {/* 今日の予約 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            本日の予約
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!todayReservations || todayReservations.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              本日の予約はありません
            </p>
          ) : (
            <div className="space-y-3">
              {todayReservations.map(res => {
                const time = new Date(res.reserved_at)
                const formattedTime = time.toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit'
                })

                return (
                  <div
                    key={res.id}
                    className="flex items-center gap-4 p-4 bg-muted rounded-lg"
                  >
                    <div className="p-2 bg-green-500/10 rounded-full">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {res.profiles?.display_name || res.profiles?.email || '顧客'}
                      </p>
                      <p className="text-sm text-muted-foreground">{formattedTime}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-sm ${
                      res.status === 'confirmed' ? 'bg-green-500/10 text-green-600' :
                      res.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' :
                      'bg-muted text-foreground'
                    }`}>
                      {res.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 今後の予約 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            今後の予約
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!upcomingReservations || upcomingReservations.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              今後の予約はありません
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingReservations.map(res => {
                const date = new Date(res.reserved_at)
                const formattedDate = date.toLocaleDateString('ja-JP', {
                  month: 'short',
                  day: 'numeric',
                  weekday: 'short'
                })
                const formattedTime = date.toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit'
                })

                return (
                  <div
                    key={res.id}
                    className="flex items-center gap-4 p-4 bg-muted rounded-lg"
                  >
                    <div className="text-center min-w-[60px]">
                      <p className="text-sm font-medium">{formattedDate}</p>
                      <p className="text-xs text-muted-foreground">{formattedTime}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {res.profiles?.display_name || res.profiles?.email || '顧客'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
