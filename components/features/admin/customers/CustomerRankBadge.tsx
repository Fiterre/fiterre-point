import { Badge } from '@/components/ui/badge'
import { Award } from 'lucide-react'

interface Props {
  rank: string
}

const RANK_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  bronze: { color: 'bg-amber-700 text-white', label: 'ブロンズ', icon: '🥉' },
  silver: { color: 'bg-gray-400 text-white', label: 'シルバー', icon: '🥈' },
  gold: { color: 'bg-yellow-500 text-white', label: 'ゴールド', icon: '🥇' },
  platinum: { color: 'bg-gray-600 text-white', label: 'プラチナ', icon: '💎' },
  diamond: { color: 'bg-cyan-400 text-white', label: 'ダイヤモンド', icon: '👑' },
}

export default function CustomerRankBadge({ rank }: Props) {
  const config = RANK_CONFIG[rank] || RANK_CONFIG.bronze

  return (
    <Badge className={`${config.color} flex items-center gap-1`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </Badge>
  )
}
