'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, Copy, Check, QrCode } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Props {
  userId: string
}

interface CodeData {
  code: string
  expiresAt: string
}

export default function CheckInCodeDisplay({ userId: _userId }: Props) {
  const [codeData, setCodeData] = useState<CodeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const { toast } = useToast()

  const fetchCode = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/checkin-code', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setCodeData(data)
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: 'コードの取得に失敗しました',
      })
    } finally {
      setLoading(false)
    }
  }

  // 初回読み込み
  useEffect(() => {
    fetchCode()
  }, [])

  // 残り時間カウントダウン
  useEffect(() => {
    if (!codeData?.expiresAt) return

    const updateTimeLeft = () => {
      const now = new Date()
      const expires = new Date(codeData.expiresAt)
      const diff = expires.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft('期限切れ')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (hours > 0) {
        setTimeLeft(`残り ${hours}時間 ${minutes}分`)
      } else {
        setTimeLeft(`残り ${minutes}分`)
      }
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 60000) // 1分ごとに更新

    return () => clearInterval(interval)
  }, [codeData?.expiresAt])

  const handleCopy = async () => {
    if (!codeData?.code) return

    await navigator.clipboard.writeText(codeData.code)
    setCopied(true)
    toast({ title: 'コピーしました' })

    setTimeout(() => setCopied(false), 2000)
  }

  const handleRefresh = () => {
    fetchCode()
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-primary/20">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-primary/20">
      <CardContent className="p-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <QrCode className="h-6 w-6 text-primary" />
            <span className="text-primary font-medium">チェックインコード</span>
          </div>

          {/* コード表示 */}
          <div className="bg-card rounded-xl p-6 mb-4 shadow-inner border">
            <div className="flex justify-center gap-2">
              {codeData?.code.split('').map((digit, index) => (
                <div
                  key={index}
                  className="w-12 h-16 flex items-center justify-center bg-muted rounded-lg text-3xl font-bold text-foreground"
                >
                  {digit}
                </div>
              ))}
            </div>
          </div>

          {/* 有効期限 */}
          <p className="text-sm text-primary mb-4">
            {timeLeft === '期限切れ' ? (
              <span className="text-red-600">コードの有効期限が切れました</span>
            ) : (
              timeLeft
            )}
          </p>

          {/* ボタン */}
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={handleCopy} disabled={!codeData?.code}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  コピー済み
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  コピー
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              更新
            </Button>
          </div>
        </div>

        {/* 使い方 */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-primary text-center">
            来店時にこのコードをスタッフにお伝えください。<br />
            チェックインで<span className="font-bold">来店ポイント</span>がもらえます！
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
