import { getNextTriggerDate, getTriggerStatus, getRecurringReservations } from '@/lib/queries/shifts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Activity, CheckCircle2, AlertCircle, SkipForward, Repeat, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

export default async function TriggerSettingsTab() {
  const [triggerInfo, triggerStatus, recurringList] = await Promise.all([
    getNextTriggerDate(),
    getTriggerStatus(),
    getRecurringReservations(),
  ])

  return (
    <div className="space-y-6">
      {/* カウントダウン */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-foreground/20 rounded-full">
                <Clock className="h-8 w-8" />
              </div>
              <div>
                <p className="text-primary-foreground/70">次回の自動反映まで</p>
                <p className="text-3xl font-bold">{triggerInfo.daysRemaining}日</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-primary-foreground/70">反映予定日</p>
              <p className="text-xl font-semibold">
                {triggerInfo.date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
              </p>
              <p className="text-sm text-primary-foreground/50">0:00 に翌月分を作成</p>
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
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">固定予約の自動反映</span>
                <Badge className={triggerStatus.activeRecurringCount > 0 ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}>
                  {triggerStatus.activeRecurringCount > 0 ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">毎月28日 0:00 実行</p>
              <p className="text-xs text-muted-foreground">対象: {triggerStatus.activeRecurringCount}件の固定予約</p>
            </div>

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
                <p className="text-sm text-muted-foreground">未実行</p>
              )}
            </div>

            <div className="p-4 border rounded-lg">
              <p className="font-medium text-sm mb-2">直近の実行結果</p>
              {triggerStatus.lastRunStats ? (
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    作成 {triggerStatus.lastRunStats.created}
                  </span>
                  <span className="flex items-center gap-1 text-yellow-600">
                    <SkipForward className="h-3.5 w-3.5" />
                    スキップ {triggerStatus.lastRunStats.skipped}
                  </span>
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    失敗 {triggerStatus.lastRunStats.failed}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">データなし</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 固定予約一覧 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              固定予約一覧（{recurringList.length}件）
            </CardTitle>
            <Link
              href="/admin/recurring"
              className="text-sm text-primary flex items-center gap-1 hover:underline"
            >
              管理ページ
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recurringList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">固定予約はありません</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(recurringList as {
                id: string
                day_of_week: number
                start_time: string
                end_time: string
                profiles: { display_name: string | null; email: string } | null
                mentors: { profiles: { display_name: string | null } } | null
                session_types: { name: string } | null
              }[]).map(rec => (
                <div key={rec.id} className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="shrink-0">
                      {DAY_LABELS[rec.day_of_week]}曜
                    </Badge>
                    <span className="text-muted-foreground">
                      {rec.start_time.slice(0, 5)}〜{rec.end_time.slice(0, 5)}
                    </span>
                    <span className="font-medium">
                      {rec.profiles?.display_name || rec.profiles?.email || '—'}
                    </span>
                  </div>
                  <span className="text-muted-foreground shrink-0">
                    {rec.mentors?.profiles?.display_name || '未設定'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            固定予約は毎月28日の0:00に翌月分が自動作成されます。手動実行は固定予約管理ページから行えます。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
