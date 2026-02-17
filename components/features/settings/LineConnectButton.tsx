'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { MessageCircle, Check, Unlink, Loader2 } from 'lucide-react'

interface Props {
  userId: string
  isConnected: boolean
}

export default function LineConnectButton({ userId, isConnected }: Props) {
  const [showInput, setShowInput] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleConnect = async () => {
    if (!code.trim()) {
      toast({ variant: 'destructive', title: 'エラー', description: '連携コードを入力してください' })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/user/line/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '連携に失敗しました')
      }

      toast({ title: '連携完了', description: 'LINEアカウントを連携しました' })
      setShowInput(false)
      setCode('')
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: error instanceof Error ? error.message : '連携に失敗しました',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('LINE連携を解除しますか？通知を受け取れなくなります。')) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/user/line/disconnect', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('解除に失敗しました')
      }

      toast({ title: '解除完了', description: 'LINE連携を解除しました' })
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: error instanceof Error ? error.message : '解除に失敗しました',
      })
    } finally {
      setLoading(false)
    }
  }

  if (isConnected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="p-2 bg-green-100 rounded-full">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-green-800">LINE連携済み</p>
            <p className="text-sm text-green-600">通知をLINEで受け取ることができます</p>
          </div>
          <Badge className="bg-green-500">連携中</Badge>
        </div>
        <Button
          variant="outline"
          onClick={handleDisconnect}
          disabled={loading}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Unlink className="h-4 w-4 mr-2" />
          )}
          連携を解除
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">LINE連携の手順</h4>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. Fiterre公式LINEアカウントを友だち追加</li>
          <li>2. トーク画面で「連携」と送信</li>
          <li>3. 届いた連携コードを下に入力</li>
        </ol>
      </div>

      {showInput ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="code">連携コード</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="LINEで受け取ったコードを入力"
              maxLength={20}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleConnect} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              連携する
            </Button>
            <Button variant="outline" onClick={() => setShowInput(false)}>
              キャンセル
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setShowInput(true)} className="bg-green-500 hover:bg-green-600">
          <MessageCircle className="h-4 w-4 mr-2" />
          LINEを連携する
        </Button>
      )}
    </div>
  )
}
