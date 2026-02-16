'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  Coins
} from 'lucide-react'

interface Transaction {
  id: string
  user_id: string
  amount: number
  balance_after: number
  type: string
  description: string | null
  created_at: string
  profiles: {
    display_name: string | null
    email: string
  } | null
  executor: {
    display_name: string | null
    email: string
  } | null
}

interface User {
  id: string
  email: string
  display_name: string | null
}

interface Props {
  initialTransactions: Transaction[]
  totalCount: number
  stats: {
    monthlyGranted: number
    monthlySpent: number
    monthlyNet: number
  }
  users: User[]
}

const TYPE_LABELS: Record<string, string> = {
  subscription_pay: 'サブスク決済',
  bonus: 'ボーナス',
  spend: '利用',
  reservation_lock: '予約ロック',
  reservation_confirm: '予約確定',
  reservation_cancel: 'キャンセル返還',
  expire: '期限切れ',
  admin_adjust: '管理者調整',
  migration: '移行',
  undo: '取消',
  referral_reward: '紹介報酬',
}

const TYPE_COLORS: Record<string, string> = {
  subscription_pay: 'bg-green-100 text-green-800',
  bonus: 'bg-blue-100 text-blue-800',
  spend: 'bg-red-100 text-red-800',
  reservation_lock: 'bg-yellow-100 text-yellow-800',
  reservation_confirm: 'bg-red-100 text-red-800',
  reservation_cancel: 'bg-green-100 text-green-800',
  expire: 'bg-gray-100 text-gray-800',
  admin_adjust: 'bg-purple-100 text-purple-800',
  referral_reward: 'bg-pink-100 text-pink-800',
}

export default function TransactionHistoryView({
  initialTransactions,
  totalCount,
  stats,
  users
}: Props) {
  const [transactions] = useState(initialTransactions)
  const [filterType, setFilterType] = useState('')
  const [filterUser, setFilterUser] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // フィルター適用
  const filteredTransactions = transactions.filter(tx => {
    if (filterType && tx.type !== filterType) return false
    if (filterUser && tx.user_id !== filterUser) return false
    return true
  })

  // CSVエクスポート
  const exportCSV = () => {
    const headers = ['日時', 'ユーザー', 'メール', '種別', '金額', '残高', '説明']
    const rows = filteredTransactions.map(tx => [
      new Date(tx.created_at).toLocaleString('ja-JP'),
      tx.profiles?.display_name || '',
      tx.profiles?.email || '',
      TYPE_LABELS[tx.type] || tx.type,
      tx.amount.toString(),
      tx.balance_after.toString(),
      tx.description || ''
    ])

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `取引履歴_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今月の付与</p>
                <p className="text-2xl font-bold text-green-600">
                  +{stats.monthlyGranted.toLocaleString()} SC
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今月の消費</p>
                <p className="text-2xl font-bold text-red-600">
                  -{stats.monthlySpent.toLocaleString()} SC
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今月の純増</p>
                <p className={`text-2xl font-bold ${stats.monthlyNet >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {stats.monthlyNet >= 0 ? '+' : ''}{stats.monthlyNet.toLocaleString()} SC
                </p>
              </div>
              <Coins className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* フィルター・エクスポート */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>取引履歴（{totalCount}件）</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                フィルター
              </Button>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" />
                CSV出力
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        {showFilters && (
          <div className="px-6 pb-4 border-b">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>種別</Label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="">すべて</option>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>ユーザー</Label>
                <select
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="">すべて</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.display_name || user.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={() => { setFilterType(''); setFilterUser('') }}
                >
                  クリア
                </Button>
              </div>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            {filteredTransactions.length === 0 ? (
              <p className="text-center py-12 text-gray-500">取引がありません</p>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">日時</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">ユーザー</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">種別</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">金額</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">残高</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">説明</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(tx.created_at).toLocaleString('ja-JP')}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">
                          {tx.profiles?.display_name || '名前未設定'}
                        </p>
                        <p className="text-xs text-gray-500">{tx.profiles?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={TYPE_COLORS[tx.type] || 'bg-gray-100'}>
                          {TYPE_LABELS[tx.type] || tx.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`flex items-center justify-end gap-1 font-medium ${
                          tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {tx.amount > 0 ? (
                            <ArrowUpCircle className="h-4 w-4" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4" />
                          )}
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500">
                        {tx.balance_after.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                        {tx.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
