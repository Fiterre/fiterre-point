'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Trash2 } from 'lucide-react'

interface Props {
  recurringId: string
}

export default function RecurringDeleteButton({ recurringId }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!confirm('この固定予約を無効化しますか？\n※既に作成済みの予約には影響しません')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/recurring?id=${recurringId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '無効化に失敗しました')
      }

      toast({ title: '無効化完了', description: '固定予約を無効化しました' })
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: error instanceof Error ? error.message : '無効化に失敗しました',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="h-6 w-6 p-0 hover:bg-red-100"
    >
      <Trash2 className="h-3 w-3 text-red-500" />
    </Button>
  )
}
