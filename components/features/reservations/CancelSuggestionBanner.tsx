'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, X } from 'lucide-react'

interface Props {
  userId: string
}

interface CancelStats {
  totalCancels: number
  monthCancels: number
  needsAttention: boolean
  suggestion: string | null
}

export default function CancelSuggestionBanner({ userId }: Props) {
  const [stats, setStats] = useState<CancelStats | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(`/api/user/cancel-stats`)
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch {
        // エラー時は表示しない
      }
    }
    fetchStats()
  }, [userId])

  if (!stats || !stats.needsAttention || dismissed || !stats.suggestion) {
    return null
  }

  return (
    <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-primary mb-1">
              ご利用ありがとうございます
            </p>
            <p className="text-sm text-primary">
              {stats.suggestion}
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="text-primary border-primary/30">
                <MessageCircle className="h-4 w-4 mr-1" />
                LINE で相談
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-primary"
                onClick={() => setDismissed(true)}
              >
                閉じる
              </Button>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-400 hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
