import { createClient } from '@/lib/supabase/server'
import { getUserReservations, getUpcomingReservations } from '@/lib/queries/reservations'
import { getUserRecurringReservations } from '@/lib/queries/shifts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Calendar, Repeat } from 'lucide-react'
import Link from 'next/link'
import CancelReservationButton from '@/components/features/reservations/CancelReservationButton'
import CancelSuggestionBanner from '@/components/features/reservations/CancelSuggestionBanner'

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

export default async function ReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [upcoming, history, recurring] = await Promise.all([
    getUpcomingReservations(user.id),
    getUserReservations(user.id),
    getUserRecurringReservations(user.id),
  ])

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-600',
      confirmed: 'bg-green-500/10 text-green-600',
      completed: 'bg-blue-500/10 text-blue-600',
      cancelled: 'bg-muted text-foreground',
      no_show: 'bg-red-500/10 text-red-600',
    }
    const labels: Record<string, string> = {
      pending: '確認待ち',
      confirmed: '確定',
      completed: '完了',
      cancelled: 'キャンセル',
      no_show: '無断欠席',
    }
    return { style: styles[status] || styles.pending, label: labels[status] || status }
  }

  return (
    <div className="space-y-6">
      {/* キャンセル多い顧客への提案 */}
      {user && <CancelSuggestionBanner userId={user.id} />}

      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-accent rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">予約管理</h1>
            <p className="text-muted-foreground">トレーニングの予約・確認</p>
          </div>
        </div>
        <Link href="/dashboard/reservations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規予約
          </Button>
        </Link>
      </div>

      {/* 固定予約 */}
      {recurring.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              固定予約スケジュール
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recurring.map((rec: {
                id: string
                day_of_week: number
                start_time: string
                end_time: string
                mentors: { profiles: { display_name: string | null } } | null
                session_types: { name: string; coin_cost: number } | null
              }) => (
                <div key={rec.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">
                      毎週{DAY_LABELS[rec.day_of_week]}曜
                      <span className="ml-2 text-sm">{rec.start_time.slice(0, 5)}〜{rec.end_time.slice(0, 5)}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {rec.session_types?.name}　メンター: {rec.mentors?.profiles?.display_name || '未設定'}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    {rec.session_types?.coin_cost.toLocaleString()} SC
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 直近の予約 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            直近の予約
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">予約がありません</p>
              <Link href="/dashboard/reservations/new">
                <Button variant="outline">予約を作成する</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((res: {
                id: string
                status: string | null
                reserved_at: string | null
                coins_used: number
                mentors: { profiles: { display_name: string | null } } | null
              }) => {
                const badge = getStatusBadge(res.status || 'pending')
                const reservedDate = res.reserved_at ? new Date(res.reserved_at) : null
                const dateStr = reservedDate ? reservedDate.toLocaleDateString('ja-JP') : ''
                const timeStr = reservedDate ? reservedDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : ''

                return (
                  <div key={res.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          {dateStr} {timeStr}〜
                        </span>
                        <Badge className={badge.style}>{badge.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        メンター: {res.mentors?.profiles?.display_name || '未設定'}
                      </p>
                      <p className="text-sm text-primary font-medium">
                        {res.coins_used.toLocaleString()} SC
                      </p>
                    </div>
                    {(res.status === 'pending' || res.status === 'confirmed') && (
                      <CancelReservationButton
                        reservationId={res.id}
                        reservedAt={res.reserved_at ?? ''}
                        coinsUsed={res.coins_used}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 予約履歴 */}
      <Card>
        <CardHeader>
          <CardTitle>予約履歴</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">履歴がありません</p>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 10).map((res: {
                id: string
                status: string | null
                reserved_at: string | null
                mentors: { profiles: { display_name: string | null } } | null
              }) => {
                const badge = getStatusBadge(res.status || 'pending')
                const reservedDate = res.reserved_at ? new Date(res.reserved_at) : null
                const dateStr = reservedDate ? reservedDate.toLocaleDateString('ja-JP') : ''
                const timeStr = reservedDate ? reservedDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : ''

                return (
                  <div key={res.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium">{dateStr} {timeStr}</p>
                      <p className="text-sm text-muted-foreground">
                        {res.mentors?.profiles?.display_name || '未設定'}
                      </p>
                    </div>
                    <Badge className={badge.style}>{badge.label}</Badge>
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
