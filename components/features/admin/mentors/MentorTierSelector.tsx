'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import TierBadge from '@/components/features/auth/TierBadge'

interface Tier {
  id: string
  tier_level: number
  tier_name: string
  description: string | null
}

interface Props {
  mentorId: string
  userId: string | undefined
  currentTierId: string | undefined
  tiers: Tier[]
}

export default function MentorTierSelector({ mentorId, userId, currentTierId, tiers }: Props) {
  const [selectedTierId, setSelectedTierId] = useState(currentTierId || '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Tier 1（Admin）は選択不可
  const selectableTiers = tiers.filter(t => t.tier_level > 1)

  const handleSave = async () => {
    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: 'ユーザーIDが見つかりません',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/mentors/tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tierId: selectedTierId || null,
        }),
      })

      if (!response.ok) {
        throw new Error('更新に失敗しました')
      }

      toast({ title: '更新完了', description: '権限Tierを更新しました' })
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: error instanceof Error ? error.message : 'エラーが発生しました',
      })
    } finally {
      setLoading(false)
    }
  }

  const hasChanges = selectedTierId !== (currentTierId || '')

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        メンターに適用するTierを選択してください。Tierによって利用可能な機能が変わります。
      </p>

      <div className="space-y-2">
        {selectableTiers.map(tier => (
          <label
            key={tier.id}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedTierId === tier.id
                ? 'border-emerald-500 bg-emerald-50'
                : 'hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="tier"
              value={tier.id}
              checked={selectedTierId === tier.id}
              onChange={() => setSelectedTierId(tier.id)}
              className="sr-only"
            />
            <TierBadge tierLevel={tier.tier_level} tierName={tier.tier_name} />
            <span className="text-sm text-gray-600">{tier.description}</span>
          </label>
        ))}
      </div>

      <Button
        onClick={handleSave}
        disabled={loading || !hasChanges}
        className="w-full"
      >
        {loading ? '更新中...' : 'Tierを更新'}
      </Button>
    </div>
  )
}
