import { createClient } from '@/lib/supabase/server'
import { getUserTransactions } from '@/lib/queries/balance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import Link from 'next/link'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const transactions = await getUserTransactions(user.id, 50)

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase: 'サブスク決済',
      bonus: 'ボーナス',
      reservation: '予約利用',
      refund: '返金',
      expiration: '期限切れ',
      adjustment: '管理者調整',
    }
    return labels[type] || type
  }

  const getTypeBadgeColor = (type: string) => {
    if (['purchase', 'bonus', 'adjustment', 'refund'].includes(type)) {
      return 'bg-green-500/10 text-green-600'
    }
    if (['reservation', 'expiration'].includes(type)) {
      return 'bg-red-500/10 text-red-600'
    }
    return 'bg-muted text-foreground'
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">取引履歴</h1>
          <p className="text-muted-foreground">コインの獲得・利用履歴</p>
        </div>
      </div>

      {/* 取引一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>履歴一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              取引履歴がありません
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {tx.amount > 0 ? (
                      <ArrowUpCircle className="h-8 w-8 text-green-500" />
                    ) : (
                      <ArrowDownCircle className="h-8 w-8 text-red-500" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeBadgeColor(tx.transaction_type)}>
                          {getTypeLabel(tx.transaction_type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {tx.description || getTypeLabel(tx.transaction_type)}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {new Date(tx.created_at).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} SC
                    </p>
                    <p className="text-xs text-muted-foreground">
                      残高: {tx.balance_after.toLocaleString()} SC
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
