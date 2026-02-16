import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Award, Clock } from 'lucide-react'

interface Props {
  userId: string
  currentRank: string
  lastFitestDate: string | null
}

const RANK_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond']
const RANK_LABELS: Record<string, string> = {
  bronze: '基礎',
  silver: '中級',
  gold: '上級',
  platinum: 'プラチナ',
  diamond: 'ダイヤモンド',
}

export default function FitestCountdown({ userId, currentRank, lastFitestDate }: Props) {
  const currentIndex = RANK_ORDER.indexOf(currentRank)
  const nextRank = currentIndex < RANK_ORDER.length - 1 ? RANK_ORDER[currentIndex + 1] : null

  // 次のFitestまでの推定日数（仮実装）
  const daysUntilNextFitest = lastFitestDate
    ? Math.max(0, 30 - Math.floor((Date.now() - new Date(lastFitestDate).getTime()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="h-5 w-5" />
          Fitest進捗
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-500">現在のランク</p>
          <p className="text-lg font-bold">{RANK_LABELS[currentRank] || currentRank}</p>
        </div>

        {nextRank && (
          <div>
            <p className="text-sm text-gray-500">次の目標</p>
            <p className="font-medium text-amber-600">{RANK_LABELS[nextRank]}へ昇格</p>
          </div>
        )}

        {daysUntilNextFitest !== null ? (
          <div className="p-3 bg-amber-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <span className="text-sm text-amber-800">
                次回Fitestまで約{daysUntilNextFitest}日
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Fitest受験歴がありません
          </p>
        )}

        <div className="text-xs text-gray-400">
          ※ Fitest機能は今後実装予定です
        </div>
      </CardContent>
    </Card>
  )
}
