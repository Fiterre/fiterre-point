import { createClient } from '@/lib/supabase/server'
import { getUserReservations, getUpcomingReservations } from '@/lib/queries/reservations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Calendar } from 'lucide-react'
import Link from 'next/link'

export default async function ReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const upcoming = await getUpcomingReservations(user.id)
  const history = await getUserReservations(user.id)

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
      no_show: 'bg-red-100 text-red-800',
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
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">予約管理</h1>
            <p className="text-gray-600">トレーニングの予約・確認</p>
          </div>
        </div>
        <Link href="/dashboard/reservations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規予約
          </Button>
        </Link>
      </div>

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
              <p className="text-gray-500 mb-4">予約がありません</p>
              <Link href="/dashboard/reservations/new">
                <Button variant="outline">予約を作成する</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((res) => {
                const badge = getStatusBadge(res.status || 'pending')
                const reservedDate = res.reserved_at ? new Date(res.reserved_at) : null
                const dateStr = reservedDate ? reservedDate.toLocaleDateString('ja-JP') : ''
                const timeStr = reservedDate ? reservedDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : ''

                return (
                  <div key={res.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          {dateStr} {timeStr}〜
                        </span>
                        <Badge className={badge.style}>{badge.label}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        メンター: {res.mentors?.profiles?.display_name || '未設定'}
                      </p>
                      <p className="text-sm text-amber-600 font-medium">
                        {res.coins_used.toLocaleString()} SC
                      </p>
                    </div>
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
            <p className="text-center py-8 text-gray-500">履歴がありません</p>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 10).map((res) => {
                const badge = getStatusBadge(res.status || 'pending')
                const reservedDate = res.reserved_at ? new Date(res.reserved_at) : null
                const dateStr = reservedDate ? reservedDate.toLocaleDateString('ja-JP') : ''
                const timeStr = reservedDate ? reservedDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : ''

                return (
                  <div key={res.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium">{dateStr} {timeStr}</p>
                      <p className="text-sm text-gray-500">
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
