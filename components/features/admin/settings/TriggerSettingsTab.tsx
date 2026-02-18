import { getNextTriggerDate, getTriggerStatus } from '@/lib/queries/shifts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Activity, CheckCircle2, AlertCircle, SkipForward } from 'lucide-react'

export default async function TriggerSettingsTab() {
  const [triggerInfo, triggerStatus] = await Promise.all([
    getNextTriggerDate(),
    getTriggerStatus()
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
