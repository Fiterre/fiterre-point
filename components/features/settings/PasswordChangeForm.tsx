'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function PasswordChangeForm() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      toast({ variant: 'destructive', title: 'エラー', description: 'パスワードは8文字以上で入力してください' })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'エラー', description: 'パスワードが一致しません' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '変更に失敗しました')
      }

      toast({ title: '変更完了', description: 'パスワードを変更しました' })
      setNewPassword('')
      setConfirmPassword('')
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="new-password">新しいパスワード</Label>
        <div className="relative mt-1">
          <Input
            id="new-password"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="8文字以上"
            minLength={8}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div>
        <Label htmlFor="confirm-password">パスワード確認</Label>
        <Input
          id="confirm-password"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="もう一度入力"
          minLength={8}
          className="mt-1"
        />
      </div>
      <Button type="submit" disabled={loading || !newPassword || !confirmPassword}>
        <Lock className="h-4 w-4 mr-2" />
        {loading ? '変更中...' : 'パスワードを変更'}
      </Button>
    </form>
  )
}
