'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Auth error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-destructive">
            エラーが発生しました
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            認証処理中に問題が発生しました。もう一度お試しください。
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => reset()} variant="default">
              再試行
            </Button>
            <Button onClick={() => window.location.href = '/login'} variant="outline">
              ログインページへ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
