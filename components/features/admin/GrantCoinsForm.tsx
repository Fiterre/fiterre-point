'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface Props {
  userId: string
  userName: string
}

export default function GrantCoinsForm({ userId, userName }: Props) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/grant-coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: parseInt(amount),
          description: description || `管理者による付与`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'エラーが発生しました')
      }

      toast({
        title: '付与完了',
        description: `${userName}に${parseInt(amount).toLocaleString()} SCを付与しました`,
      })

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

  const presetAmounts = [
    { label: 'ライト (19,000)', value: 19000 },
    { label: 'スタンダード (40,000)', value: 40000 },
    { label: 'プレミアム (85,000)', value: 85000 },
    { label: 'ボーナス (5,000)', value: 5000 },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>プリセット金額</Label>
        <div className="flex flex-wrap gap-2">
          {presetAmounts.map((preset) => (
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <Label htmlFor="description">説明（任意）</Label>
          <Input
            id="description"
            type="text"
            placeholder="例: 2月分サブスク決済"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" disabled={loading || !amount} className="w-full">
        {loading ? '処理中...' : `${amount ? parseInt(amount).toLocaleString() : '0'} SC を付与する`}
      </Button>
    </form>
  )
}
