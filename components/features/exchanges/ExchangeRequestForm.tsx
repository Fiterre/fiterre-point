'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tag, Package, Loader2 } from 'lucide-react'
import type { ExchangeItem, ExchangeItemCategory } from '@/types/database'

interface Props {
  items: ExchangeItem[]
  availableBalance: number
}

const CATEGORY_CONFIG: Record<ExchangeItemCategory, { label: string; icon: typeof Tag; color: string }> = {
  discount: { label: '割引', icon: Tag, color: 'bg-blue-500/10 text-blue-600' },
  goods: { label: '物品', icon: Package, color: 'bg-green-500/10 text-green-600' },
}

export default function ExchangeRequestForm({ items, availableBalance }: Props) {
  const [selectedItemId, setSelectedItemId] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const submittingRef = useRef(false)
  const router = useRouter()
  const { toast } = useToast()

  const selectedItem = items.find(i => i.id === selectedItemId)
  const canAfford = selectedItem ? availableBalance >= selectedItem.coin_cost : true

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedItem) {
      toast({ variant: 'destructive', title: 'エラー', description: '交換アイテムを選択してください' })
      return
    }
    if (!canAfford) {
      toast({ variant: 'destructive', title: 'コイン不足', description: 'コインが足りません' })
      return
    }
    setConfirmOpen(true)
  }

  const executeRequest = async () => {
    setConfirmOpen(false)
    if (submittingRef.current) return
    submittingRef.current = true
    setLoading(true)

    try {
      const response = await fetch('/api/exchanges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exchangeItemId: selectedItemId }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || '申請に失敗しました')
      }

      toast({ title: '申請完了', description: `${selectedItem!.name} の交換を申請しました` })
      setSelectedItemId('')
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: error instanceof Error ? error.message : '申請に失敗しました',
      })
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        交換可能なアイテムがありません
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => {
          const catConfig = CATEGORY_CONFIG[item.category]
          const CatIcon = catConfig.icon
          const affordable = availableBalance >= item.coin_cost

          return (
            <div
              key={item.id}
              onClick={() => affordable && setSelectedItemId(item.id)}
              className={`p-4 border rounded-lg transition-colors ${
                !affordable
                  ? 'opacity-50 cursor-not-allowed'
                  : selectedItemId === item.id
                    ? 'border-primary bg-primary/5 cursor-pointer'
                    : 'hover:border-gray-300 cursor-pointer'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <CatIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs mt-1 ${catConfig.color}`}>
                      {catConfig.label}
                    </span>
                  </div>
                </div>
                <p className={`font-bold shrink-0 ${affordable ? 'text-primary' : 'text-red-600'}`}>
                  {item.coin_cost.toLocaleString()} SC
                </p>
              </div>
              {!affordable && (
                <p className="text-red-600 text-xs mt-2">
                  コイン不足（あと{(item.coin_cost - availableBalance).toLocaleString()} SC必要）
                </p>
              )}
            </div>
          )
        })}
      </div>

      {selectedItem && (
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex justify-between items-center">
            <span>ロックされるSC</span>
            <span className={`font-bold ${canAfford ? 'text-primary' : 'text-red-600'}`}>
              {selectedItem.coin_cost.toLocaleString()} SC
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            対応完了時にSCが消費されます。キャンセル時は返還されます。
          </p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !selectedItemId || !canAfford}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            処理中...
          </>
        ) : (
          '交換を申請する'
        )}
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>交換を申請しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{selectedItem?.name}」の交換を申請します。
              {selectedItem?.coin_cost.toLocaleString()} SC がロックされます。
              対応完了後にSCが消費されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={executeRequest}>申請する</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}
