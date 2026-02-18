import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Medal, Award } from 'lucide-react'
import Link from 'next/link'

interface RankingItem {
  userId: string
  displayName: string
  totalCoins: number
  position: number
  rank: string
}

interface Props {
  rankings: RankingItem[]
  currentUserId?: string
  showViewAll?: boolean
}

const POSITION_ICONS = [
  { icon: Trophy, color: 'text-yellow-500' },
  { icon: Medal, color: 'text-muted-foreground' },
  { icon: Award, color: 'text-primary' },
]

const RANK_COLORS: Record<string, string> = {
  bronze: 'bg-amber-700',
  silver: 'bg-gray-400',
  gold: 'bg-yellow-500',
  platinum: 'bg-gray-600',
  diamond: 'bg-cyan-400',
}

export default function CoinRankingCard({ rankings, currentUserId, showViewAll = false }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            コインランキング
          </span>
          {showViewAll && (
            <Link href="/admin/rankings" className="text-sm text-primary hover:underline">
              すべて見る →
            </Link>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rankings.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">ランキングデータがありません</p>
        ) : (
          <div className="space-y-3">
            {rankings.map((item) => {
              const isCurrentUser = item.userId === currentUserId
              const PositionIcon = POSITION_ICONS[item.position - 1]?.icon
              const positionColor = POSITION_ICONS[item.position - 1]?.color

              return (
                <div
                  key={item.userId}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isCurrentUser
                      ? 'bg-primary/5 border border-primary/20'
                      : 'hover:bg-muted'
                  }`}
                >
                  {/* 順位 */}
                  <div className="w-8 text-center">
                    {PositionIcon ? (
                      <PositionIcon className={`h-6 w-6 mx-auto ${positionColor}`} />
                    ) : (
                      <span className="text-lg font-bold text-muted-foreground">
                        {item.position}
                      </span>
                    )}
                  </div>

                  {/* ユーザー情報 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                        {item.displayName}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-primary">(あなた)</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${RANK_COLORS[item.rank] || RANK_COLORS.bronze}`} />
                      <span className="text-xs text-muted-foreground capitalize">{item.rank}</span>
                    </div>
                  </div>

                  {/* コイン数 */}
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {item.totalCoins.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">SC</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
