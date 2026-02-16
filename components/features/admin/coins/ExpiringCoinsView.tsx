'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import {
  AlertTriangle,
  Clock,
  Calendar,
  RefreshCw
} from 'lucide-react'

interface ExpiringCoin {
  id: string
  user_id: string
  amount_current: number
  amount_locked: number
  expires_at: string
  created_at: string
  profiles: {
    display_name: string | null
    email: string
  }
}

interface Props {
  initialCoins: ExpiringCoin[]
  stats: {
    within7Days: { count: number; amount: number }
    within30Days: { count: number; amount: number }
  }
}

const EXTEND_OPTIONS = [
  { label: '30日', days: 30 },
  { label: '60日', days: 60 },
  { label: '90日', days: 90 },
]

export default function ExpiringCoinsView({ initialCoins, stats }: Props) {
  const [coins] = useState(initialCoins)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [filterDays, setFilterDays] = useState<number>(30)
  const router = useRouter()
  const { toast } = useToast()

  // 日数でフィルター
  const now = new Date()
  const filteredCoins = coins.filter(coin => {
    const expiry = new Date(coin.expires_at)
    const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil <= filterDays
  })

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const selectAll = () => {
    setSelectedIds(filteredCoins.map(c => c.id))
  }

  const deselectAll = () => {
    setSelectedIds([])
  }

  const getDaysUntilExpiry = (expiresAt: string) => {
    const expiry = new Date(expiresAt)
    const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  const getExpiryBadge = (daysUntil: number) => {
    if (daysUntil <= 0) {
      return <Badge className="bg-red-600 text-white">期限切れ</Badge>
    } else if (daysUntil <= 7) {
      return <Badge className="bg-red-100 text-red-800">あと{daysUntil}日</Badge>
    } else if (daysUntil <= 14) {
      return <Badge className="bg-yellow-100 text-yellow-800">あと{daysUntil}日</Badge>
    } else {
      return <Badge className="bg-blue-100 text-blue-800">あと{daysUntil}日</Badge>
    }
  }

  const handleExtend = async (days: number) => {
    if (selectedIds.length === 0) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: '延長するコインを選択してください',
      })
      return
    }

    if (!confirm(`${selectedIds.length}件のコインを${days}日延長しますか？`)) return

    setLoading(true)

    try {
      const response = await fetch('/api/admin/coins/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ledgerIds: selectedIds,
          additionalDays: days,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '延長に失敗しました')
      }

      toast({
        title: '延長完了',
        description: `${data.success}件のコインを${days}日延長しました`,
      })

      setSelectedIds([])
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
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={stats.within7Days.count > 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">7日以内に期限切れ</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.within7Days.count}件
                </p>
                <p className="text-sm text-red-500">
                  {stats.within7Days.amount.toLocaleString()} SC
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">30日以内に期限切れ</p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.within30Days.count}件
                </p>
                <p className="text-sm text-amber-500">
                  {stats.within30Days.amount.toLocaleString()} SC
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* コイン一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              期限切れ予定のコイン
            </span>
            <div className="flex items-center gap-2">
              <select
                value={filterDays}
                onChange={(e) => setFilterDays(parseInt(e.target.value))}
                className="h-9 px-3 border rounded-md text-sm"
              >
                <option value={7}>7日以内</option>
                <option value={14}>14日以内</option>
                <option value={30}>30日以内</option>
              </select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 一括操作 */}
          <div className="flex flex-wrap items-center gap-2 pb-4 border-b">
            <Button variant="outline" size="sm" onClick={selectAll}>
              全選択
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              全解除
            </Button>
            <span className="text-sm text-gray-500 mx-2">
              {selectedIds.length}件選択中
            </span>
            <div className="flex-1" />
            {EXTEND_OPTIONS.map(opt => (
              <Button
                key={opt.days}
                variant="outline"
                size="sm"
                onClick={() => handleExtend(opt.days)}
                disabled={loading || selectedIds.length === 0}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                {opt.label}延長
              </Button>
            ))}
          </div>

          {/* リスト */}
          {filteredCoins.length === 0 ? (
            <p className="text-center py-12 text-gray-500">
              期限切れ予定のコインはありません
            </p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {filteredCoins.map((coin) => {
                const daysUntil = getDaysUntilExpiry(coin.expires_at)
                return (
                  <label
                    key={coin.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      selectedIds.includes(coin.id) ? 'bg-amber-50 border-amber-300' : ''
                    } ${daysUntil <= 7 ? 'border-red-200' : ''}`}
                  >
                    <Checkbox
                      checked={selectedIds.includes(coin.id)}
                      onCheckedChange={() => toggleSelect(coin.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {coin.profiles?.display_name || '名前未設定'}
                        </p>
                        {getExpiryBadge(daysUntil)}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {coin.profiles?.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-600">
                        {coin.amount_current.toLocaleString()} SC
                      </p>
                      <p className="text-xs text-gray-500">
                        期限: {new Date(coin.expires_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
