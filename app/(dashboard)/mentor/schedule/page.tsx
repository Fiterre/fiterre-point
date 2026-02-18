import { getCurrentUser } from '@/lib/queries/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, User, CheckCircle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { DAY_OF_WEEK_LABELS } from '@/lib/queries/shifts'

export default async function MentorSchedulePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = createAdminClient()

  // メンターIDを取得
  const { data: mentor } = await supabase
    .from('mentors')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!mentor) redirect('/mentor')

  // 今日の日付
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const dayOfWeek = now.getDay() // 0=日, 1=月, ...

  // 今日の予約
  const { data: todayReservations } = await supabase
    .from('reservations')
    .select(`
      *,
      profiles:user_id (
        display_name,
        email
      ),
      session_types (
        name
      )
    `)
    .eq('mentor_id', mentor.id)
    .gte('reserved_at', `${todayStr}T00:00:00`)
    .lt('reserved_at', `${todayStr}T23:59:59`)
    .in('status', ['confirmed', 'pending', 'completed'])
    .order('reserved_at')

  // 今週の残りの予約
  const endOfWeek = new Date(now)
  endOfWeek.setDate(now.getDate() + (7 - dayOfWeek))
  const endOfWeekStr = endOfWeek.toISOString().split('T')[0]

  const { data: weekReservations } = await supabase
    .from('reservations')
    .select(`
      *,
      profiles:user_id (
        display_name,
        email
      ),
      session_types (
        name
      )
    `)
    .eq('mentor_id', mentor.id)
    .gt('reserved_at', `${todayStr}T23:59:59`)
    .lte('reserved_at', `${endOfWeekStr}T23:59:59`)
    .in('status', ['confirmed', 'pending'])
    .order('reserved_at')

  // このメンターのシフト
  const { data: shifts } = await supabase
    .from('mentor_shifts')
    .select('*')
    .eq('mentor_id', mentor.id)
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time')

  const statusLabel: Record<string, { text: string; class: string }> = {
    confirmed: { text: '確定', class: 'bg-green-500/10 text-green-600' },
    pending: { text: '仮予約', class: 'bg-yellow-500/10 text-yellow-600' },
    completed: { text: '完了', class: 'bg-blue-500/10 text-blue-600' },
    cancelled: { text: 'キャンセル', class: 'bg-red-500/10 text-red-600' },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">スケジュール</h1>
        <p className="text-muted-foreground">
          {now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      {/* 今日の予約 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            本日の予約（{todayReservations?.length || 0}件）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!todayReservations || todayReservations.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">本日の予約はありません</p>
          ) : (
            <div className="space-y-3">
              {todayReservations.map(res => {
                const time = new Date(res.reserved_at)
                const formattedTime = time.toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                const st = statusLabel[res.status] || { text: res.status, class: 'bg-muted text-muted-foreground' }

                return (
                  <div key={res.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="text-center min-w-[60px]">
                      <p className="text-lg font-bold text-foreground">{formattedTime}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {(res.profiles as any)?.display_name || (res.profiles as any)?.email || '顧客'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(res.session_types as any)?.name || 'セッション'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${st.class}`}>
                      {st.text}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 今週の残り */}
      {weekReservations && weekReservations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              今週の残り予約（{weekReservations.length}件）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weekReservations.map(res => {
                const date = new Date(res.reserved_at)
                const formatted = date.toLocaleDateString('ja-JP', {
                  month: 'short',
                  day: 'numeric',
                  weekday: 'short',
                })
                const time = date.toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit',
                })

                return (
                  <div key={res.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="text-center min-w-[80px]">
                      <p className="text-sm font-medium text-foreground">{formatted}</p>
                      <p className="text-xs text-muted-foreground">{time}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {(res.profiles as any)?.display_name || (res.profiles as any)?.email || '顧客'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(res.session_types as any)?.name || 'セッション'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* シフト一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            登録シフト
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!shifts || shifts.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">シフトが登録されていません</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {shifts.map(shift => (
                <div
                  key={shift.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    shift.day_of_week === dayOfWeek ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <span className={`text-sm font-bold w-8 text-center ${
                    shift.day_of_week === dayOfWeek ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {DAY_OF_WEEK_LABELS[shift.day_of_week]}
                  </span>
                  <span className="text-sm text-foreground">
                    {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
                  </span>
                  {shift.day_of_week === dayOfWeek && (
                    <span className="text-xs text-primary font-medium ml-auto">今日</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
