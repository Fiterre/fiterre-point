'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2, CheckCircle, XCircle, User, Coins } from 'lucide-react'

interface Props {
  mentorId: string
}

interface VerifyResult {
  valid: boolean
  userId?: string
  userName?: string
  userEmail?: string
  reservationId?: string
  codeId?: string
  message: string
}

export default function CheckInForm({ mentorId }: Props) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const { toast } = useToast()

  // 自動フォーカス
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // 数字のみ

    const newCode = [...code]
    newCode[index] = value.slice(-1) // 1文字のみ

    setCode(newCode)
    setVerifyResult(null)

    // 次の入力欄にフォーカス
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // 6桁入力完了で自動検証
    if (newCode.every(c => c) && newCode.join('').length === 6) {
      verifyCode(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)

    if (pastedData.length === 6) {
      const newCode = pastedData.split('')
      setCode(newCode)
      verifyCode(pastedData)
    }
  }

  const verifyCode = async (codeString: string) => {
    setVerifying(true)

    try {
      const response = await fetch('/api/checkin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeString }),
      })

      const data = await response.json()
      setVerifyResult(data)
    } catch {
      setVerifyResult({ valid: false, message: '検証に失敗しました' })
    } finally {
      setVerifying(false)
    }
  }

  const handleCheckIn = async () => {
    if (!verifyResult?.valid || !verifyResult.userId) return

    setLoading(true)

    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: verifyResult.userId,
          reservationId: verifyResult.reservationId,
          codeId: verifyResult.codeId,
          method: 'code'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'チェックインに失敗しました')
      }

      toast({
        title: 'チェックイン完了',
        description: data.message,
      })

      // リセット
      setCode(['', '', '', '', '', ''])
      setVerifyResult(null)
      inputRefs.current[0]?.focus()
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: error instanceof Error ? error.message : 'チェックインに失敗しました',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setCode(['', '', '', '', '', ''])
    setVerifyResult(null)
    inputRefs.current[0]?.focus()
  }

  return (
    <div className="space-y-6">
      {/* コード入力 */}
      <div className="flex justify-center gap-2">
        {code.map((digit, index) => (
          <Input
            key={index}
            ref={(el) => { inputRefs.current[index] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            className="w-14 h-16 text-center text-2xl font-bold"
            disabled={loading || verifying}
          />
        ))}
      </div>

      {/* 検証中 */}
      {verifying && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>コードを確認中...</span>
        </div>
      )}

      {/* 検証結果 */}
      {verifyResult && !verifying && (
        <Card className={verifyResult.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {verifyResult.valid ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
              <div className="flex-1">
                {verifyResult.valid ? (
                  <>
                    <p className="font-medium text-green-800">コードが確認されました</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-green-700">
                      <User className="h-4 w-4" />
                      <span>{verifyResult.userName || verifyResult.userEmail || '顧客'}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-red-800">{verifyResult.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ボタン */}
      <div className="flex gap-3 justify-center">
        <Button
          variant="outline"
          onClick={handleClear}
          disabled={loading}
        >
          クリア
        </Button>
        <Button
          onClick={handleCheckIn}
          disabled={loading || !verifyResult?.valid}
          className="min-w-[200px]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              処理中...
            </>
          ) : (
            <>
              <Coins className="h-4 w-4 mr-2" />
              チェックイン & ポイント付与
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
