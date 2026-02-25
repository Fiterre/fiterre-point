export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/queries/auth'
import { getUserTier } from '@/lib/queries/permissions'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMentorTodayReservations } from '@/lib/queries/reservations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calendar, ClipboardList, FileText } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export default async function MentorDashboardPage() {
  const user = await getCurrentUser()
  const tierData = user ? await getUserTier(user.id) : null

  // メンターID取得
  const supabase = createAdminClient()
  const { data: mentor } = user
    ? await supabase.from('mentors').select('id').eq('user_id', user.id).maybeSingle()
    : { data: null }

  // 本日の予約を取得
  const todayReservations = mentor ? await getMentorTodayReservations(mentor.id) : []

  // 最近のチェックイン取得（直近5件）
  const { data: recentCheckIns } = mentor
    ? await supabase
        .from('check_in_logs')
        .select(`
          id,
          check_in_at,
          method,
          profiles:user_id (
            display_name,
            email
          )
        `)
        .eq('verified_by', user!.id)
        .order('check_in_at', { ascending: false })
        .limit(5)
    : { data: [] }

  const quickActions = [
    {
      href: '/mentor/customers',
      label: '担当顧客',
      description: '顧客情報を確認',
      icon: Users,
      color: 'bg-blue-500/10 text-blue-500'
    },
    {
      href: '/mentor/schedule',
      label: '本日の予約',
      description: 'スケジュールを確認',
      icon: Calendar,
      color: 'bg-green-500/10 text-green-500'
    },
    {
      href: '/mentor/records',
      label: 'トレーニング記録',
      description: '記録を入力・確認',
      icon: ClipboardList,
      color: 'bg-primary/10 text-primary'
    },
    {
      href: '/mentor/fitest',
      label: 'Fitest',
      description: 'テスト実施・結果入力',
      icon: FileText,
      color: 'bg-purple-500/10 text-purple-500'
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">メンターダッシュボード</h1>
        <p className="text-muted-foreground">
          ようこそ、{user?.email} さん
          {tierData?.tier && (
            <span className="ml-2 text-sm text-primary">
              ({tierData.tier.tier_name})
            </span>
          )}
        </p>
      </div>

      {/* クイックアクション */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className={`p-3 rounded-full w-fit ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mt-4">{action.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 本日の予約 */}
      <Card>
        <CardHeader>
          <CardTitle>本日の予約（{todayReservations.length}件）</CardTitle>
        </CardHeader>
        <CardContent>
          {todayReservations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              本日の予約はありません
            </p>
          ) : (
            <div className="space-y-3">
              {todayReservations.map((res) => {
                const reservedAt = new Date(res.reserved_at)
                const profile = res.profiles as unknown as { display_name: string } | null
                return (
                  <div key={res.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">
                        {reservedAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {profile?.display_name || '顧客'}
                      </p>
                    </div>
                    <Badge className={res.status === 'confirmed' ? 'bg-green-500/10 text-green-700' : 'bg-yellow-500/10 text-yellow-700'}>
                      {res.status === 'confirmed' ? '確定' : '未確定'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 最近の活動 */}
      <Card>
        <CardHeader>
          <CardTitle>最近の活動</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentCheckIns || recentCheckIns.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              アクティビティがありません
            </p>
          ) : (
            <div className="space-y-3">
              {recentCheckIns.map((log) => {
                const checkedAt = new Date(log.check_in_at)
                const profile = log.profiles as unknown as { display_name: string; email: string } | null
                return (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">
                        {profile?.display_name || profile?.email || '顧客'} のチェックイン
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {checkedAt.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                        {' '}
                        {checkedAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {log.method === 'code' ? 'コード' : log.method === 'qr' ? 'QR' : '手動'}
                    </Badge>
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
