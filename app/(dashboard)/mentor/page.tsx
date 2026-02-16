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
      color: 'bg-blue-100 text-blue-600'
    },
    {
      href: '/mentor/schedule',
      label: '本日の予約',
      description: 'スケジュールを確認',
      icon: Calendar,
      color: 'bg-green-100 text-green-600'
    },
    {
      href: '/mentor/records',
      label: 'トレーニング記録',
      description: '記録を入力・確認',
      icon: ClipboardList,
      color: 'bg-amber-100 text-amber-600'
    },
    {
      href: '/mentor/fitest',
      label: 'Fitest',
      description: 'テスト実施・結果入力',
      icon: FileText,
      color: 'bg-purple-100 text-purple-600'
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">メンターダッシュボード</h1>
        <p className="text-gray-600">
          ようこそ、{user?.email} さん
          {tierData?.tier && (
            <span className="ml-2 text-sm text-emerald-600">
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
                <p className="text-sm text-gray-600 mt-1">{action.description}</p>
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
          <p className="text-gray-500 text-center py-8">
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
          <p className="text-gray-500 text-center py-8">
            アクティビティがありません
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
