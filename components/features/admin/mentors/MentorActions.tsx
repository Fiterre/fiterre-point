'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { AlertTriangle, Power, PowerOff, Trash2 } from 'lucide-react'

interface Props {
  mentorId: string
  mentorName: string
  isActive: boolean
}

export default function MentorActions({ mentorId, mentorName, isActive }: Props) {
  const [loading, setLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'toggle' | 'delete' | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const toggleActive = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/mentors/${mentorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '更新に失敗しました')
      }

      toast({
        title: '更新完了',
        description: `${mentorName} を${isActive ? '無効化' : '有効化'}しました`,
      })
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

  const deleteMentor = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/mentors/${mentorId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '削除に失敗しました')
      }

      toast({
        title: '削除完了',
        description: `${mentorName} のメンター権限を削除しました`,
      })
      router.push('/admin/mentors')
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
          メンター操作
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {confirmAction ? (
          <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5 space-y-3">
            <p className="font-medium text-destructive">
              {confirmAction === 'toggle' && (isActive
                ? `${mentorName} を無効化しますか？`
                : `${mentorName} を有効化しますか？`
              )}
              {confirmAction === 'delete' && `${mentorName} のメンター権限を削除しますか？`}
            </p>
            <p className="text-sm text-muted-foreground">
              {confirmAction === 'toggle' && (isActive
                ? '無効化すると、予約の受付ができなくなります。'
                : '有効化すると、再び予約を受け付けられるようになります。'
              )}
              {confirmAction === 'delete' && 'メンター権限が削除され、一般ユーザーに戻ります。シフト情報は残りますが、予約は受け付けられなくなります。'}
            </p>
            <div className="flex gap-2">
              <Button
                variant={confirmAction === 'delete' ? 'destructive' : 'default'}
                size="sm"
                onClick={confirmAction === 'toggle' ? toggleActive : deleteMentor}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmAction('toggle')}
            >
              {isActive ? (
                <>
                  <PowerOff className="h-4 w-4 mr-1" />
                  無効化
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-1" />
                  有効化
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmAction('delete')}
              className="text-destructive border-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              メンター削除
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
