import { Badge } from '@/components/ui/badge'
import { FileText, ClipboardList, User } from 'lucide-react'
import Link from 'next/link'

interface MentorRecord {
  id: string
  user_id: string
  record_date: string
  record_type: 'daily' | 'monthly'
  title: string | null
  content: string
  profiles?: {
    display_name: string | null
    email: string
  }
}

interface Props {
  records: MentorRecord[]
}

export default function MentorRecordsList({ records }: Props) {
  if (records.length === 0) {
    return (
      <p className="text-center py-8 text-gray-500">
        記録がありません
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {records.map((record: MentorRecord) => {
        const date = new Date(record.record_date)
        const formattedDate = date.toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
        const isMonthly = record.record_type === 'monthly'

        return (
          <Link
            key={record.id}
            href={`/mentor/records/${record.id}`}
            className="block"
          >
            <div className={`flex items-center gap-4 p-4 rounded-lg border hover:shadow-md transition-shadow ${
              isMonthly ? 'bg-amber-50 border-amber-200' : 'bg-white'
            }`}>
              <div className={`p-2 rounded-full ${isMonthly ? 'bg-amber-100' : 'bg-blue-100'}`}>
                {isMonthly ? (
                  <FileText className={`h-5 w-5 ${isMonthly ? 'text-amber-600' : 'text-blue-600'}`} />
                ) : (
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{formattedDate}</Badge>
                  <Badge className={isMonthly ? 'bg-amber-500' : 'bg-blue-500'}>
                    {isMonthly ? '月次' : '日次'}
                  </Badge>
                </div>
                <p className="font-medium mt-1 truncate">
                  {record.title || (isMonthly ? '努力の軌跡' : 'トレーニングログ')}
                </p>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <User className="h-3 w-3" />
                  {record.profiles?.display_name || record.profiles?.email || '不明'}
                </p>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
