'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
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
import type { ExchangeRequestStatus, ExchangeItemCategory } from '@/types/database'

interface ExchangeRequestItem {
  id: string
  user_id: string
  coins_locked: number
  status: ExchangeRequestStatus
  created_at: string
  completed_at: string | null
  cancelled_at: string | null
  exchange_items: {
    name: string
    category: ExchangeItemCategory
    coin_cost: number
  }
  profiles: {
    display_name: string | null
    email: string
  }
}

interface Props {
  requests: ExchangeRequestItem[]
  canManage: boolean // admin/mentor can update status
  canComplete?: boolean // admin only - mentor cannot change to 'completed'
  showUserInfo?: boolean // admin/mentor see user info
}

const STATUS_CONFIG: Record<ExchangeRequestStatus, { label: string; color: string }> = {
  requested: { label: '申請中', color: 'bg-yellow-500/10 text-yellow-600' },
  ordering: { label: '発注中', color: 'bg-blue-500/10 text-blue-600' },
  completed: { label: '対応済み', color: 'bg-green-500/10 text-green-600' },
  cancelled: { label: 'キャンセル', color: 'bg-muted text-foreground' },
}

const CATEGORY_ICON: Record<ExchangeItemCategory, typeof Tag> = {
  discount: Tag,
  goods: Package,
}

export default function ExchangeRequestList({ requests, canManage, canComplete = true, showUserInfo }: Props) {
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [confirmData, setConfirmData] = useState<{
    id: string
    status: string
    itemName: string
    coins: number
    isCancelConfirm?: boolean
  } | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleStatusChange = async (requestId: string, newStatus: string, itemName: string, coins: number) => {
    // 対応済み・取消は確認ダイアログを表示
    if (newStatus === 'completed' || newStatus === 'cancelled') {
      setConfirmData({ id: requestId, status: newStatus, itemName, coins, isCancelConfirm: newStatus === 'cancelled' })
      return
    }

    await executeStatusUpdate(requestId, newStatus)
  }

  const executeStatusUpdate = async (requestId: string, newStatus: string) => {
    setConfirmData(null)
    setUpdatingId(requestId)

    try {
      const response = await fetch(`/api/exchanges/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'ステータス更新に失敗しました')
      }

      const statusLabel = STATUS_CONFIG[newStatus as ExchangeRequestStatus]?.label || newStatus
      toast({ title: '更新完了', description: `ステータスを「${statusLabel}」に更新しました` })
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: error instanceof Error ? error.message : 'エラーが発生しました',
      })
    } finally {
      setUpdatingId(null)
    }
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        交換申請はまだありません
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {requests.map((req) => {
          const statusConfig = STATUS_CONFIG[req.status]
          const CatIcon = req.exchange_items?.category ? CATEGORY_ICON[req.exchange_items.category] : Package
          const isActive = req.status === 'requested' || req.status === 'ordering'
          const isUpdating = updatingId === req.id

          return (
            <Card key={req.id} className={!isActive ? 'opacity-70' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <CatIcon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{req.exchange_items?.name ?? '（削除済みアイテム）'}</p>
                      {showUserInfo && (
                        <p className="text-sm text-muted-foreground truncate">
                          {req.profiles?.display_name || '名前未設定'} ({req.profiles?.email || '不明'})
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-primary">
                          {req.coins_locked.toLocaleString()} SC
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(req.created_at).toLocaleDateString('ja-JP', {
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* ステータス操作ボタン（admin/mentorのみ・アクティブなもののみ） */}
                  {canManage && isActive && (
                    <div className="flex gap-2 shrink-0">
                      {isUpdating ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          {req.status === 'requested' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(req.id, 'ordering', req.exchange_items?.name ?? '', req.coins_locked)}
                            >
                              発注中へ
                            </Button>
                          )}
                          {req.status === 'ordering' && canComplete && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(req.id, 'completed', req.exchange_items?.name ?? '', req.coins_locked)}
                            >
                              対応済みへ
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleStatusChange(req.id, 'cancelled', req.exchange_items?.name ?? '', req.coins_locked)}
                          >
                            取消
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 対応済み・取消 確認ダイアログ */}
      <AlertDialog open={!!confirmData} onOpenChange={() => setConfirmData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmData?.isCancelConfirm ? '申請を取り消しますか？' : '対応済みにしますか？'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmData?.isCancelConfirm ? (
                <>
                  「{confirmData?.itemName}」の申請を取り消します。
                  ロック中の {confirmData?.coins.toLocaleString()} SC は返還されます。
                </>
              ) : (
                <>
                  「{confirmData?.itemName}」を対応済みにすると、
                  ロック中の {confirmData?.coins.toLocaleString()} SC が消費されます。
                  この操作は取り消せません。
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>戻る</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmData && executeStatusUpdate(confirmData.id, confirmData.status)}
              className={confirmData?.isCancelConfirm ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {confirmData?.isCancelConfirm ? '取り消す' : '対応済みにする（SC消費）'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
