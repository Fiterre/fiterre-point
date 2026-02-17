import { Badge } from '@/components/ui/badge'
import { Trophy, XCircle, User } from 'lucide-react'
import Link from 'next/link'
import { FITEST_LEVEL_LABELS, FitestLevel } from '@/types/database'

interface Result {
  id: string
  test_date: string
  current_level: FitestLevel
  target_level: FitestLevel
  total_score: number | null
  passed: boolean
  profiles?: {
    display_name: string | null
    email: string
  }
}

interface Props {
  results: Result[]
}

export default function RecentFitestList({ results }: Props) {
  if (results.length === 0) {
    return (
      <p className="text-center py-8 text-gray-500">
        Fitest結果がありません
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {results.map(result => {
        const date = new Date(result.test_date)
        const formattedDate = date.toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })

        return (
          <Link
            key={result.id}
            href={`/mentor/fitest/${result.id}`}
            className="block"
          >
            <div className={`flex items-center gap-4 p-4 rounded-lg border hover:shadow-md transition-shadow ${
              result.passed ? 'bg-green-50 border-green-200' : 'bg-white'
            }`}>
              <div className={`p-2 rounded-full ${result.passed ? 'bg-green-100' : 'bg-gray-100'}`}>
                {result.passed ? (
                  <Trophy className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{formattedDate}</Badge>
                  <Badge className="bg-gray-500">
                    {FITEST_LEVEL_LABELS[result.current_level]} → {FITEST_LEVEL_LABELS[result.target_level]}
                  </Badge>
                  <Badge className={result.passed ? 'bg-green-500' : 'bg-red-400'}>
                    {result.passed ? '合格' : '不合格'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <User className="h-3 w-3" />
                  {result.profiles?.display_name || result.profiles?.email || '不明'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{result.total_score || 0}</p>
                <p className="text-xs text-gray-500">点</p>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
