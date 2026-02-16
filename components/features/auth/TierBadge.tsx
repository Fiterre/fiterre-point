import { Badge } from '@/components/ui/badge'

interface TierBadgeProps {
  tierLevel: number
  tierName: string
}

const tierColors: Record<number, string> = {
  1: 'bg-red-100 text-red-800 border-red-300',
  2: 'bg-purple-100 text-purple-800 border-purple-300',
  3: 'bg-blue-100 text-blue-800 border-blue-300',
  4: 'bg-green-100 text-green-800 border-green-300',
  5: 'bg-gray-100 text-gray-800 border-gray-300',
}

export default function TierBadge({ tierLevel, tierName }: TierBadgeProps) {
  const colorClass = tierColors[tierLevel] || tierColors[5]

  return (
    <Badge className={`${colorClass} border`}>
      {tierName}
    </Badge>
  )
}
