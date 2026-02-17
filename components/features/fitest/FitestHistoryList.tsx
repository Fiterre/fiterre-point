import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, XCircle, ChevronRight, Dumbbell, Brain, Scale } from 'lucide-react'
import Link from 'next/link'
import { FITEST_LEVEL_LABELS, FitestLevel, FitestResultWithRelations } from '@/types/database'

interface Props {
  results: FitestResultWithRelations[]
}

export default function FitestHistoryList({ results }: Props) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>まだFitestを受験していません</p>
        <p className="text-sm mt-2">メンターに相談して昇格試験に挑戦しましょう！</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {results.map(result => {
        const date = new Date(result.test_date)
        const formattedDate = date.toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })

        return (
          <Link key={result.id} href={`/dashboard/fitest/${result.id}`}>
            <Card className={`hover:shadow-md transition-shadow cursor-pointer ${
              result.passed ? 'border-green-200 bg-green-50/50' : ''
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${result.passed ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {result.passed ? (
                        <Trophy className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formattedDate}</span>
                        <Badge className={result.passed ? 'bg-green-500' : 'bg-gray-400'}>
                          {result.passed ? '合格' : '不合格'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                        <span>{FITEST_LEVEL_LABELS[result.current_level as FitestLevel]}</span>
                        <ChevronRight className="h-3 w-3" />
                        <span>{FITEST_LEVEL_LABELS[result.target_level as FitestLevel]}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* スコア詳細 */}
                    <div className="hidden md:flex items-center gap-4 text-sm">
                      {result.memory_game_score !== null && (
                        <div className="flex items-center gap-1 text-purple-600">
                          <Brain className="h-4 w-4" />
                          <span>{result.memory_game_score}</span>
                        </div>
                      )}
                      {result.big3_total !== null && (
                        <div className="flex items-center gap-1 text-red-600">
                          <Dumbbell className="h-4 w-4" />
                          <span>{result.big3_total}kg</span>
                        </div>
                      )}
                      {result.weight_difference !== null && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Scale className="h-4 w-4" />
                          <span>±{Math.abs(result.weight_difference).toFixed(1)}kg</span>
                        </div>
                      )}
                    </div>

                    {/* 総合スコア */}
                    <div className="text-right">
                      <p className="text-2xl font-bold">{result.total_score || 0}</p>
                      <p className="text-xs text-gray-500">点</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
