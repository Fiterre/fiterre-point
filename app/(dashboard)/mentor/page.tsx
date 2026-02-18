import { getCurrentUser } from '@/lib/queries/auth'
import { getUserTier } from '@/lib/queries/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calendar, ClipboardList, FileText } from 'lucide-react'
import Link from 'next/link'

export default async function MentorDashboardPage() {
  const user = await getCurrentUser()
  const tierData = user ? await getUserTier(user.id) : null

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

      {/* 本日の予約（プレースホルダー） */}
      <Card>
        <CardHeader>
          <CardTitle>本日の予約</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            本日の予約はありません
          </p>
        </CardContent>
      </Card>

      {/* 最近の活動（プレースホルダー） */}
      <Card>
        <CardHeader>
          <CardTitle>最近の活動</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            アクティビティがありません
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
