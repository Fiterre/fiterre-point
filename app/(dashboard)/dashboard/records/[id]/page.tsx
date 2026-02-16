import { getCurrentUser } from '@/lib/queries/auth'
import { getRecordById } from '@/lib/queries/trainingRecords'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, User, Dumbbell, FileText } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function RecordDetailPage({ params }: Props) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const record = await getRecordById(id)

  if (!record) {
    notFound()
  }

  // 自分の記録かどうか確認
  if (record.user_id !== user.id) {
    notFound()
  }

  const date = new Date(record.record_date)
  const formattedDate = date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  const isMonthly = record.record_type === 'monthly'

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/records"
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge className={isMonthly ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'}>
              {isMonthly ? '努力の軌跡' : 'トレーニングログ'}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            {record.title || (isMonthly ? '月次レポート' : 'トレーニング記録')}
          </h1>
        </div>
      </div>

      {/* メタ情報 */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {formattedDate}
        </span>
        {record.mentors?.profiles?.display_name && (
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            担当: {record.mentors.profiles.display_name}
          </span>
        )}
      </div>

      {/* 本文 */}
      <Card className={isMonthly ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200' : ''}>
        <CardContent className="p-6">
          <div className="prose prose-gray max-w-none">
            {record.content.split('\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* エクササイズ詳細（日次のみ） */}
      {!isMonthly && record.exercises && record.exercises.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Dumbbell className="h-5 w-5" />
              実施種目
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {record.exercises.map((exercise, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{exercise.name}</span>
                  <div className="flex gap-4 text-sm text-gray-600">
                    {exercise.sets && <span>{exercise.sets}セット</span>}
                    {exercise.reps && <span>{exercise.reps}レップ</span>}
                    {exercise.weight && <span>{exercise.weight}kg</span>}
                    {exercise.duration && <span>{exercise.duration}分</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* メモ */}
      {record.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              メモ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{record.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
