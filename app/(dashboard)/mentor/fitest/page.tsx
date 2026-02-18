export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/queries/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Award, Trophy } from 'lucide-react'
import Link from 'next/link'
import RecentFitestList from '@/components/features/fitest/RecentFitestList'
import { getRecentFitestResults } from '@/lib/queries/fitest'

export default async function MentorFitestPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const recentResults = await getRecentFitestResults(20)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fitest管理</h1>
          <p className="text-muted-foreground">昇格試験の実施・結果入力</p>
        </div>
        <Link href="/mentor/fitest/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Fitest実施
          </Button>
        </Link>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">今月の実施数</p>
                <p className="text-xl font-bold">{recentResults.filter(r => {
                  const d = new Date(r.test_date)
                  const now = new Date()
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
                }).length}件</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-full">
                <Trophy className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">合格者数（今月）</p>
                <p className="text-xl font-bold">{recentResults.filter(r => {
                  const d = new Date(r.test_date)
                  const now = new Date()
                  return r.passed && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
                }).length}名</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-full">
                <Award className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">累計実施数</p>
                <p className="text-xl font-bold">{recentResults.length}件</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最近の結果 */}
      <Card>
        <CardHeader>
          <CardTitle>最近のFitest結果</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentFitestList results={recentResults} />
        </CardContent>
      </Card>
    </div>
  )
}
