export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/queries/auth'
import { getUserBalance } from '@/lib/queries/balance'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeftRight } from 'lucide-react'
import ExchangeRequestForm from '@/components/features/exchanges/ExchangeRequestForm'
import ExchangeRequestList from '@/components/features/exchanges/ExchangeRequestList'

export default async function CustomerExchangesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = createAdminClient()

  // 交換アイテム取得
  const { data: items } = await supabase
    .from('exchange_items')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  // 自分の申請のみ
  const { data: requests } = await supabase
    .from('exchange_requests')
    .select(`
      *,
      exchange_items (*),
      profiles:user_id (display_name, email)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const balance = await getUserBalance(user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ArrowLeftRight className="h-6 w-6" />
          交換
        </h1>
        <p className="text-muted-foreground">SCをグッズや特典割引と交換できます</p>
      </div>

      {/* 新規申請 */}
      <Card>
        <CardHeader>
          <CardTitle>交換を申請する</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
            利用可能残高: <span className="font-bold text-primary">{balance.available.toLocaleString()} SC</span>
            {balance.locked > 0 && (
              <span className="ml-2 text-muted-foreground">
                （ロック中: {balance.locked.toLocaleString()} SC）
              </span>
            )}
          </div>
          <ExchangeRequestForm items={items ?? []} availableBalance={balance.available} />
        </CardContent>
      </Card>

      {/* 申請履歴 */}
      <Card>
        <CardHeader>
          <CardTitle>申請履歴</CardTitle>
        </CardHeader>
        <CardContent>
          <ExchangeRequestList
            requests={requests ?? []}
            canManage={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
