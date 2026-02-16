'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Play, Loader2 } from 'lucide-react'

export default function ExecuteRecurringButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleExecute = async () => {
    if (!confirm('翌月分の固定予約を今すぐ作成しますか？\n\n※ 通常は毎月28日0時に自動実行されます')) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/recurring/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetMonth: 'next' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '実行に失敗しました')
      }

      toast({
        title: '反映完了',
        description: `${data.targetMonth}の予約を作成しました\n作成: ${data.created}件 / スキップ: ${data.skipped}件`,
      })

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

  return (
    <Button onClick={handleExecute} disabled={loading} variant="outline">
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Play className="h-4 w-4 mr-2" />
      )}
      今すぐ反映
    </Button>
  )
}
