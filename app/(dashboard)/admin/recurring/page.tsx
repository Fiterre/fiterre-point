import { getRecurringReservations, getNextTriggerDate, getTriggerStatus, DAY_OF_WEEK_LABELS } from '@/lib/queries/shifts'
import ExecuteRecurringButton from '@/components/features/admin/ExecuteRecurringButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Clock, Calendar, Activity, CheckCircle2, AlertCircle, SkipForward } from 'lucide-react'
import Link from 'next/link'

export default async function AdminRecurringPage() {
  const [recurringReservations, triggerInfo, triggerStatus] = await Promise.all([
    getRecurringReservations(),
    getNextTriggerDate(),
    getTriggerStatus()
  ])

  // 曜日ごとにグループ化
  const byDayOfWeek = [0, 1, 2, 3, 4, 5, 6].map(day => ({
    day,
    label: DAY_OF_WEEK_LABELS[day],
    reservations: recurringReservations.filter(r => r.day_of_week === day)
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">固定予約（保証枠）</h1>
          <p className="text-gray-600">毎週同じ曜日・時間の予約を自動作成</p>
        </div>
        <div className="flex gap-2">
          <ExecuteRecurringButton />
          <Link href="/admin/recurring/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              固定予約追加
            </Button>
          </Link>
        </div>
      </div>

      {/* 次回反映カウントダウン */}
      <Card className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Clock className="h-8 w-8" />
              </div>
              <div>
                <p className="text-amber-100">次回の自動反映まで</p>
                <p className="text-3xl font-bold">{triggerInfo.daysRemaining}日</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-amber-100">反映予定日</p>
              <p className="text-xl font-semibold">
                {triggerInfo.date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
              </p>
              <p className="text-sm text-amber-200">0:00 に翌月分を作成</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* トリガーステータス */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            トリガーステータス
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 固定予約の自動反映 */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">固定予約の自動反映</span>
                <Badge className={triggerStatus.activeRecurringCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {triggerStatus.activeRecurringCount > 0 ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">毎月28日 0:00 実行</p>
              <p className="text-xs text-gray-500">対象: {triggerStatus.activeRecurringCount}件の固定予約</p>
            </div>

            {/* 最終実行日時 */}
            <div className="p-4 border rounded-lg">
              <p className="font-medium text-sm mb-2">最終実行</p>
              {triggerStatus.lastRunAt ? (
                <p className="text-sm">
                  {new Date(triggerStatus.lastRunAt).toLocaleString('ja-JP', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              ) : (
                <p className="text-sm text-gray-400">未実行</p>
              )}
            </div>

            {/* 直近の実行結果 */}
            <div className="p-4 border rounded-lg">
              <p className="font-medium text-sm mb-2">直近の実行結果</p>
              {triggerStatus.lastRunStats ? (
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1 text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    作成 {triggerStatus.lastRunStats.created}
                  </span>
                  <span className="flex items-center gap-1 text-amber-700">
                    <SkipForward className="h-3.5 w-3.5" />
                    スキップ {triggerStatus.lastRunStats.skipped}
                  </span>
                  <span className="flex items-center gap-1 text-red-700">
                    <AlertCircle className="h-3.5 w-3.5" />
                    失敗 {triggerStatus.lastRunStats.failed}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-400">データなし</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 曜日別の固定予約 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {byDayOfWeek.map(({ day, label, reservations }) => (
          <Card key={day} className={day === 0 ? 'border-red-200' : day === 6 ? 'border-blue-200' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-lg ${day === 0 ? 'text-red-600' : day === 6 ? 'text-blue-600' : ''}`}>
                {label}曜日
                <Badge variant="outline" className="ml-2">
                  {reservations.length}件
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reservations.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">なし</p>
              ) : (
                <div className="space-y-2">
                  {reservations
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .map(res => (
                      <div key={res.id} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {res.start_time.slice(0, 5)}〜{res.end_time.slice(0, 5)}
                          </span>
                          <Badge className="bg-amber-100 text-amber-800 text-xs">
                            {res.session_types?.coin_cost?.toLocaleString()} SC
                          </Badge>
                        </div>
                        <p className="text-gray-600 mt-1">
                          {res.profiles?.display_name || res.profiles?.email || '顧客'}
                        </p>
                        <p className="text-gray-400 text-xs">
                          担当: {res.mentors?.profiles?.display_name || 'メンター'}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {recurringReservations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">固定予約が登録されていません</p>
            <Link href="/admin/recurring/new">
              <Button>固定予約を追加する</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
