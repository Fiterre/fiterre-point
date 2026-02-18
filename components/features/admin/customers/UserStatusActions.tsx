'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { AlertTriangle, Ban, Trash2, CheckCircle } from 'lucide-react'

interface Props {
  userId: string
  currentStatus: string
  userName: string
}

export default function UserStatusActions({ userId, currentStatus, userName }: Props) {
  const [loading, setLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const updateStatus = async (newStatus: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '更新に失敗しました')
      }

      toast({ title: '更新完了', description: `ステータスを${newStatus}に変更しました` })
      setConfirmAction(null)
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          アカウント操作
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {confirmAction ? (
          <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5 space-y-3">
            <p className="font-medium text-destructive">
              {confirmAction === 'suspended' && `${userName} を停止しますか？`}
              {confirmAction === 'deleted' && `${userName} を削除しますか？`}
              {confirmAction === 'active' && `${userName} を再有効化しますか？`}
            </p>
            <p className="text-sm text-muted-foreground">
              {confirmAction === 'suspended' && 'ユーザーはログインできなくなります。'}
              {confirmAction === 'deleted' && 'ユーザーは論理削除されます。データは保持されます。'}
              {confirmAction === 'active' && 'ユーザーは再びログインできるようになります。'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => updateStatus(confirmAction)}
                disabled={loading}
              >
                {loading ? '処理中...' : '確認'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmAction(null)}
                disabled={loading}
              >
                キャンセル
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {currentStatus !== 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmAction('active')}
                className="text-green-600 border-green-600 hover:bg-green-500/10"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                有効化
              </Button>
            )}
            {currentStatus !== 'suspended' && currentStatus !== 'deleted' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmAction('suspended')}
                className="text-yellow-600 border-yellow-600 hover:bg-yellow-500/10"
              >
                <Ban className="h-4 w-4 mr-1" />
                停止
              </Button>
            )}
            {currentStatus !== 'deleted' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmAction('deleted')}
                className="text-destructive border-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                削除
              </Button>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          現在のステータス: {currentStatus}
        </p>
      </CardContent>
    </Card>
  )
}
