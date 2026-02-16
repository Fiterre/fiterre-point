'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Search, Users } from 'lucide-react'

interface User {
  id: string
  email: string
  display_name: string | null
  status: string
}

interface Props {
  users: User[]
}

const PRESET_AMOUNTS = [
  { label: 'ライト (19,000)', value: 19000 },
  { label: 'スタンダード (40,000)', value: 40000 },
  { label: 'プレミアム (85,000)', value: 85000 },
  { label: 'ボーナス (5,000)', value: 5000 },
  { label: 'ボーナス (10,000)', value: 10000 },
]

export default function BulkGrantForm({ users }: Props) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // アクティブユーザーのみ
  const activeUsers = users.filter(u => u.status === 'active')

  // 検索フィルター
  const filteredUsers = activeUsers.filter(user =>
    searchQuery === '' ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const selectAll = () => {
    setSelectedUserIds(filteredUsers.map(u => u.id))
  }

  const deselectAll = () => {
    setSelectedUserIds([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedUserIds.length === 0) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: 'ユーザーを選択してください',
      })
      return
    }

    if (!amount || parseInt(amount) <= 0) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: '付与額を入力してください',
      })
      return
    }

    const confirmMessage = `${selectedUserIds.length}名に ${parseInt(amount).toLocaleString()} SC を付与しますか？`
    if (!confirm(confirmMessage)) return

    setLoading(true)

    try {
      const response = await fetch('/api/admin/coins/bulk-grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUserIds,
          amount: parseInt(amount),
          description: description || '一括付与',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '付与に失敗しました')
      }

      toast({
        title: '付与完了',
        description: `${data.successCount}名に ${parseInt(amount).toLocaleString()} SC を付与しました`,
      })

      setSelectedUserIds([])
      setAmount('')
      setDescription('')
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ユーザー選択 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              ユーザー選択
            </span>
            <span className="text-sm font-normal text-gray-500">
              {selectedUserIds.length} / {activeUsers.length} 名選択中
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 検索・一括選択 */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="名前またはメールで検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="button" variant="outline" onClick={selectAll}>
              全選択
            </Button>
            <Button type="button" variant="outline" onClick={deselectAll}>
              全解除
            </Button>
          </div>

          {/* ユーザーリスト */}
          <div className="max-h-64 overflow-y-auto border rounded-lg">
            {filteredUsers.map(user => (
              <label
                key={user.id}
                className={`flex items-center gap-3 p-3 cursor-pointer border-b last:border-0 hover:bg-gray-50 ${
                  selectedUserIds.includes(user.id) ? 'bg-amber-50' : ''
                }`}
              >
                <Checkbox
                  checked={selectedUserIds.includes(user.id)}
                  onCheckedChange={() => toggleUser(user.id)}
                />
                <div className="flex-1">
                  <p className="font-medium">{user.display_name || '名前未設定'}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </label>
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-center py-4 text-gray-500">該当するユーザーがいません</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 付与設定 */}
      <Card>
        <CardHeader>
          <CardTitle>付与設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* プリセット金額 */}
          <div className="space-y-2">
            <Label>プリセット金額</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset.value}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(preset.value.toString())}
                  className={amount === preset.value.toString() ? 'border-amber-500 bg-amber-50' : ''}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 付与額入力 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">付与額 (SC)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="19000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Input
                id="description"
                type="text"
                placeholder="例: 3月分サブスク"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* 確認表示 */}
          {selectedUserIds.length > 0 && amount && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="font-medium text-amber-800">付与内容</p>
              <p className="text-amber-700">
                {selectedUserIds.length}名 × {parseInt(amount).toLocaleString()} SC =
                合計 {(selectedUserIds.length * parseInt(amount)).toLocaleString()} SC
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || selectedUserIds.length === 0 || !amount}
      >
        {loading ? '処理中...' : `${selectedUserIds.length}名に一括付与する`}
      </Button>
    </form>
  )
}
