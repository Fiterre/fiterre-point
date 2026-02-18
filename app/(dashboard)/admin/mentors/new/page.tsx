'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function NewMentorPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [lineUserId, setLineUserId] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!displayName.trim() || !email.trim()) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: '名前とメールアドレスは必須です',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/mentors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          email: email.trim(),
          lineUserId: lineUserId.trim() || undefined,
          specialty: specialty.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '登録に失敗しました')
      }

      toast({
        title: '登録完了',
        description: `${displayName} をメンターとして登録しました`,
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/mentors">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">メンター追加</h1>
          <p className="text-gray-600">新しいメンターを登録します</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>メンター情報</CardTitle>
            <CardDescription>
              既存ユーザーのメールアドレスを入力すると、そのユーザーにメンター権限を付与します。
              新規の場合は自動的にアカウントが作成されます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="displayName">
                  名前 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="山田太郎"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  メールアドレス <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mentor@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialty">専門分野</Label>
                <Input
                  id="specialty"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="パーソナルトレーニング"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lineUserId">LINE UID（任意）</Label>
                <Input
                  id="lineUserId"
                  value={lineUserId}
                  onChange={(e) => setLineUserId(e.target.value)}
                  placeholder="U1234567890abcdef..."
                />
                <p className="text-xs text-gray-500">
                  LINE通知を有効にする場合に入力してください
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? '登録中...' : 'メンターを登録'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
