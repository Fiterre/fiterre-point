import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Dumbbell, User } from 'lucide-react'
import Link from 'next/link'

interface Exercise {
  name: string
  sets?: number
  reps?: number
  weight?: number
  duration?: number
  notes?: string
}

interface DailyRecord {
  id: string
  record_date: string
  title: string | null
  content: string
  exercises: Exercise[]
  mentors?: {
    profiles: {
      display_name: string | null
    }
  }
}

interface Props {
  records: DailyRecord[]
}

export default function DailyRecordsList({ records }: Props) {
  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>トレーニング記録がまだありません</p>
          <p className="text-sm mt-2">セッション後にメンターが記録を追加します</p>
        </CardContent>
      </Card>
    )
  }

  // 日付でグループ化
  const groupedByMonth: { [key: string]: DailyRecord[] } = {}
  records.forEach(record => {
    const date = new Date(record.record_date)
    const monthKey = `${date.getFullYear()}年${date.getMonth() + 1}月`
    if (!groupedByMonth[monthKey]) {
      groupedByMonth[monthKey] = []
    }
    groupedByMonth[monthKey].push(record)
  })

  return (
    <div className="space-y-6">
      {Object.entries(groupedByMonth).map(([month, monthRecords]: [string, DailyRecord[]]) => (
        <div key={month}>
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {month}
          </h3>
          <div className="space-y-3">
            {monthRecords.map((record: DailyRecord) => {
              const date = new Date(record.record_date)
              const formattedDate = date.toLocaleDateString('ja-JP', {
                month: 'short',
                day: 'numeric',
                weekday: 'short'
              })

              return (
                <Link key={record.id} href={`/dashboard/records/${record.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{formattedDate}</Badge>
                            {record.mentors?.profiles?.display_name && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {record.mentors.profiles.display_name}
                              </span>
                            )}
                          </div>
                          <h4 className="font-medium">
                            {record.title || 'トレーニングログ'}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {record.content}
                          </p>
                          {record.exercises && record.exercises.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {record.exercises.slice(0, 3).map((ex: Exercise, i: number) => (
                                <Badge key={i} className="bg-amber-100 text-amber-800 text-xs">
                                  {ex.name}
                                </Badge>
                              ))}
                              {record.exercises.length > 3 && (
                                <Badge className="bg-gray-100 text-gray-600 text-xs">
                                  +{record.exercises.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
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
