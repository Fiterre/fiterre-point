'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Trash2 } from 'lucide-react'

interface Props {
  shiftId: string
}

export default function ShiftDeleteButton({ shiftId }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!confirm('このシフトを削除しますか？')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/shifts?id=${shiftId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '削除に失敗しました')
      }

      toast({ title: '削除完了', description: 'シフトを削除しました' })
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: error instanceof Error ? error.message : '削除に失敗しました',
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
