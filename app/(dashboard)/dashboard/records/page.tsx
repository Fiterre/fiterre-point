import { getCurrentUser } from '@/lib/queries/auth'
import { getUserRecords, getMonthlyReports } from '@/lib/queries/trainingRecords'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, FileText, Calendar } from 'lucide-react'
import DailyRecordsList from '@/components/features/records/DailyRecordsList'
import MonthlyReportsList from '@/components/features/records/MonthlyReportsList'

export default async function UserRecordsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const [dailyRecords, monthlyReports] = await Promise.all([
    getUserRecords(user.id, 'daily', 30),
    getMonthlyReports(user.id)
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">トレーニング記録</h1>
        <p className="text-muted-foreground">あなたのトレーニング履歴と月次レポート</p>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            トレーニングログ
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            努力の軌跡
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-6">
          <DailyRecordsList records={dailyRecords} />
        </TabsContent>

        <TabsContent value="monthly" className="mt-6">
          <MonthlyReportsList reports={monthlyReports} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
