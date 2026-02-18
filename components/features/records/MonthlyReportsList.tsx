import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, TrendingUp, User } from 'lucide-react'
import Link from 'next/link'

interface MonthlyReport {
  id: string
  record_date: string
  title: string | null
  content: string
  mentors?: {
    profiles: {
      display_name: string | null
    }
  }
}

interface Props {
  reports: MonthlyReport[]
}

export default function MonthlyReportsList({ reports }: Props) {
  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p>月次レポートがまだありません</p>
          <p className="text-sm mt-2">毎月、メンターがあなたの成長をまとめます</p>
        </CardContent>
      </Card>
    )
  }

  // 年でグループ化
  const groupedByYear: { [key: string]: MonthlyReport[] } = {}
  reports.forEach(report => {
    const date = new Date(report.record_date)
    const year = `${date.getFullYear()}年`
    if (!groupedByYear[year]) {
      groupedByYear[year] = []
    }
    groupedByYear[year].push(report)
  })

  return (
    <div className="space-y-6">
      {Object.entries(groupedByYear).map(([year, yearReports]: [string, MonthlyReport[]]) => (
        <div key={year}>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {year}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {yearReports.map((report: MonthlyReport) => {
              const date = new Date(report.record_date)
              const monthName = date.toLocaleDateString('ja-JP', { month: 'long' })

              return (
                <Link key={report.id} href={`/dashboard/records/${report.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full bg-gradient-to-br from-amber-50 to-orange-50 border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-primary/50 text-white">
                          {monthName}
                        </Badge>
                        {report.mentors?.profiles?.display_name && (
                          <span className="text-xs text-primary flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {report.mentors.profiles.display_name}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-primary">
                        {report.title || '努力の軌跡'}
                      </h4>
                      <p className="text-sm text-primary mt-2 line-clamp-3">
                        {report.content}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
