import { Badge } from '@/components/ui/badge'

interface TierBadgeProps {
  tierLevel: number
  tierName: string
}

const tierColors: Record<number, string> = {
  1: 'bg-red-500/10 text-red-600 border-red-300',
  2: 'bg-purple-100 text-purple-800 border-purple-300',
  3: 'bg-blue-500/10 text-blue-600 border-blue-300',
  4: 'bg-green-500/10 text-green-600 border-green-300',
  5: 'bg-muted text-foreground border-border',
}

export default function TierBadge({ tierLevel, tierName }: TierBadgeProps) {
  const colorClass = tierColors[tierLevel] || tierColors[5]

  return (
    <Badge className={`${colorClass} border`}>
      {tierName}
    </Badge>
  )
}
