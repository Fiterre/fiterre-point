'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Pencil, Save, X } from 'lucide-react'

interface Props {
  displayName: string
  email: string
  rank: string
}

export default function ProfileEditForm({ displayName, email, rank }: Props) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(displayName)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const rankLabel: Record<string, string> = {
    bronze: 'ブロンズ',
    silver: 'シルバー',
    gold: 'ゴールド',
    platinum: 'プラチナ',
    diamond: 'ダイヤモンド',
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'エラー', description: '表示名を入力してください' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: name }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '更新に失敗しました')
      }

      toast({ title: '更新完了', description: '表示名を変更しました' })
      setEditing(false)
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
    <div className="space-y-4">
      <div>
        <Label className="text-sm text-muted-foreground">メールアドレス</Label>
        <p className="font-medium text-foreground">{email}</p>
      </div>
      <div>
        <Label className="text-sm text-muted-foreground">表示名</Label>
        {editing ? (
          <div className="flex items-center gap-2 mt-1">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="表示名を入力"
              maxLength={50}
              className="max-w-xs"
            />
            <Button size="sm" onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-1" />
              {loading ? '保存中...' : '保存'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setEditing(false); setName(displayName) }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground">{displayName || '未設定'}</p>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      <div>
        <Label className="text-sm text-muted-foreground">ランク</Label>
        <p className="font-medium text-foreground capitalize">{rankLabel[rank] || rank}</p>
      </div>
    </div>
  )
}
