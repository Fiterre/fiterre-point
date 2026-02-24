'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-destructive">
            エラーが発生しました
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            ページの読み込み中に問題が発生しました。
            再試行するか、問題が続く場合は管理者にお問い合わせください。
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => reset()} variant="default">
              再試行
            </Button>
            <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
              ダッシュボードへ戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
