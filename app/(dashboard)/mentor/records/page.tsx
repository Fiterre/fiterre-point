import { getCurrentUser } from '@/lib/queries/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ClipboardList, FileText } from 'lucide-react'
import Link from 'next/link'
import MentorRecordsList from '@/components/features/mentor/MentorRecordsList'
import { getRecentMentorRecords } from '@/lib/queries/trainingRecords'

export default async function MentorRecordsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const recentRecords = await getRecentMentorRecords(user.id, 20)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">トレーニング記録</h1>
          <p className="text-gray-600">顧客のトレーニングログと月次レポートを管理</p>
        </div>
        <div className="flex gap-2">
          <Link href="/mentor/records/new?type=daily">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              ログ追加
            </Button>
          </Link>
          <Link href="/mentor/records/new?type=monthly">
            <Button variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50">
              <FileText className="h-4 w-4 mr-2" />
              月次レポート作成
            </Button>
          </Link>
        </div>
      </div>

      {/* 最近の記録 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            最近の記録
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MentorRecordsList records={recentRecords} />
        </CardContent>
      </Card>
    </div>
  )
}
