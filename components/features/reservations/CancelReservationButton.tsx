'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { X, AlertTriangle, Loader2 } from 'lucide-react'

interface Props {
  reservationId: string
  reservedAt: string
  coinsUsed: number
}

export default function CancelReservationButton({ reservationId, reservedAt, coinsUsed }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [cancelInfo, setCancelInfo] = useState<{
    canCancel: boolean
    isWithinDeadline: boolean
    reason?: string
  } | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  // ダイアログを開く時にキャンセル可否をチェック
  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen)

    if (isOpen && !cancelInfo) {
      setChecking(true)
      try {
        const response = await fetch(`/api/reservations/${reservationId}/cancel`)
        const data = await response.json()
        setCancelInfo(data)
      } catch {
        setCancelInfo({ canCancel: false, isWithinDeadline: false, reason: 'エラーが発生しました' })
      } finally {
        setChecking(false)
      }
    }
  }

  const handleCancel = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/reservations/${reservationId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason || undefined }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'キャンセルに失敗しました')
      }

      toast({
        title: 'キャンセル完了',
        description: data.message,
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: error instanceof Error ? error.message : 'キャンセルに失敗しました',
      })
    } finally {
      setLoading(false)
    }
  }

  const reservationDate = new Date(reservedAt)
  const formattedDate = reservationDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
  const formattedTime = reservationDate.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
          <X className="h-4 w-4 mr-1" />
          キャンセル
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>予約をキャンセル</DialogTitle>
          <DialogDescription>
            {formattedDate} {formattedTime} の予約
          </DialogDescription>
        </DialogHeader>

        {checking ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/70" />
            <span className="ml-2 text-muted-foreground">確認中...</span>
          </div>
        ) : cancelInfo ? (
          <div className="space-y-4">
            {!cancelInfo.canCancel ? (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-red-800">{cancelInfo.reason}</p>
              </div>
            ) : (
              <>
                {/* 警告メッセージ */}
                {cancelInfo.isWithinDeadline ? (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-800 font-medium">
                      キャンセル期限内です
                    </p>
                    <p className="text-green-700 text-sm mt-1">
                      {coinsUsed.toLocaleString()} SC が返還されます
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-800 font-medium">
                          キャンセル期限を過ぎています
                        </p>
                        <p className="text-red-700 text-sm mt-1">
                          {coinsUsed.toLocaleString()} SC は没収されます
                        </p>
                        <p className="text-red-600 text-xs mt-2">
                          ※ 前日23:59を過ぎているため、コインは返還されません
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* キャンセル理由 */}
                <div className="space-y-2">
                  <Label htmlFor="reason">キャンセル理由（任意）</Label>
                  <Input
                    id="reason"
                    placeholder="体調不良など"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            戻る
          </Button>
          {cancelInfo?.canCancel && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  処理中...
                </>
              ) : (
                'キャンセルする'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
