import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award, Calendar, Target, Trophy, ChevronRight } from 'lucide-react'
import { FITEST_LEVEL_LABELS, FitestLevel, FitestMilestone, FitestResult } from '@/types/database'

interface Props {
  latestResult: FitestResult | undefined
  nextDate: Date | null
  milestones: FitestMilestone[]
  totalTests: number
  passedCount: number
}

const LEVEL_ORDER: FitestLevel[] = ['beginner', 'intermediate', 'advanced', 'master']

const LEVEL_COLORS: { [key: string]: string } = {
  beginner: 'bg-amber-700',
  intermediate: 'bg-gray-400',
  advanced: 'bg-yellow-500',
  master: 'bg-cyan-400'
}

export default function FitestProgressCard({
  latestResult,
  nextDate,
  milestones,
  totalTests,
  passedCount
}: Props) {
  const currentLevel: FitestLevel = latestResult?.passed
    ? latestResult.target_level
    : (latestResult?.current_level || 'beginner')

  const currentIndex = LEVEL_ORDER.indexOf(currentLevel)
  const nextLevel = currentIndex < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[currentIndex + 1] : null

  const nextMilestone = nextLevel
    ? milestones.find(m => m.from_level === currentLevel && m.to_level === nextLevel)
    : null

  const daysUntilNext = nextDate
    ? Math.ceil((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 現在のレベル */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-full shadow">
              <Award className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-amber-700">現在のレベル</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${LEVEL_COLORS[currentLevel]} text-white text-lg px-3 py-1`}>
                  {FITEST_LEVEL_LABELS[currentLevel]}
                </Badge>
              </div>
            </div>
          </div>

          {/* レベル進捗バー */}
          <div className="mt-6">
            <div className="flex justify-between mb-2">
              {LEVEL_ORDER.map((level, index) => (
                <div
                  key={level}
                  className={`text-xs ${index <= currentIndex ? 'text-amber-700 font-medium' : 'text-gray-400'}`}
                >
                  {FITEST_LEVEL_LABELS[level]}
                </div>
              ))}
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all"
                style={{ width: `${((currentIndex + 1) / LEVEL_ORDER.length) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 次の目標 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              {nextLevel ? (
                <>
                  <p className="text-sm text-gray-500">次の目標</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${LEVEL_COLORS[nextLevel]} text-white`}>
                      {FITEST_LEVEL_LABELS[nextLevel]}
                    </Badge>
                    <span className="text-gray-400">への昇格</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500">おめでとうございます！</p>
                  <p className="font-bold text-lg">最高レベル達成</p>
                </>
              )}
            </div>
          </div>

          {nextMilestone && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
              <p className="font-medium mb-2">合格基準:</p>
              <ul className="space-y-1 text-gray-600">
                {nextMilestone.min_memory_score && (
                  <li className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3" />
                    神経衰弱: {nextMilestone.min_memory_score}点以上
                  </li>
                )}
                {nextMilestone.min_big3_total && (
                  <li className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3" />
                    Big3トータル: {nextMilestone.min_big3_total}kg以上
                  </li>
                )}
                {nextMilestone.max_weight_difference && (
                  <li className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3" />
                    体重誤差: {nextMilestone.max_weight_difference}kg以内
                  </li>
                )}
              </ul>
              {nextMilestone.reward_coins > 0 && (
                <p className="mt-2 text-amber-600 font-medium">
                  合格報酬: {nextMilestone.reward_coins.toLocaleString()} SC
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 統計 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Trophy className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">テスト実績</p>
              <p className="text-2xl font-bold">
                {passedCount}<span className="text-lg text-gray-400">/{totalTests}</span>
                <span className="text-sm text-gray-500 ml-2">合格</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 次回予定 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">次回Fitest予定</p>
              {daysUntilNext !== null && daysUntilNext > 0 ? (
                <p className="text-2xl font-bold">
                  あと<span className="text-purple-600">{daysUntilNext}</span>日
                </p>
              ) : totalTests > 0 ? (
                <p className="text-lg font-bold text-purple-600">受験可能です！</p>
              ) : (
                <p className="text-gray-500">まだ受験していません</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
