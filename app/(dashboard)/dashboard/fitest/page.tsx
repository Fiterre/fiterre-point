import { getCurrentUser } from '@/lib/queries/auth'
import { getUserFitestResults, getNextFitestDate, getMilestones } from '@/lib/queries/fitest'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import FitestProgressCard from '@/components/features/fitest/FitestProgressCard'
import FitestHistoryList from '@/components/features/fitest/FitestHistoryList'

export default async function UserFitestPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const [results, nextDate, milestones] = await Promise.all([
    getUserFitestResults(user.id),
    getNextFitestDate(user.id),
    getMilestones()
  ])

  const latestResult = results[0]
  const passedCount = results.filter(r => r.passed).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fitest</h1>
        <p className="text-muted-foreground">あなたの昇格試験の記録</p>
      </div>

      {/* 進捗カード */}
      <FitestProgressCard
        latestResult={latestResult}
        nextDate={nextDate}
        milestones={milestones}
        totalTests={results.length}
        passedCount={passedCount}
      />

      {/* 過去の結果 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            テスト履歴
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FitestHistoryList results={results} />
        </CardContent>
      </Card>
    </div>
  )
}
