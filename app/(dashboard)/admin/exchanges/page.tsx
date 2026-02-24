export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'
import { getUserBalance } from '@/lib/queries/balance'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeftRight, ClipboardList } from 'lucide-react'
import ExchangeRequestForm from '@/components/features/exchanges/ExchangeRequestForm'
import ExchangeRequestList from '@/components/features/exchanges/ExchangeRequestList'

export default async function AdminExchangesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const admin = await isAdmin(user.id)
  if (!admin) redirect('/dashboard')

  const supabase = createAdminClient()

  // 交換アイテム取得
  const { data: items } = await supabase
    .from('exchange_items')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  // 全申請取得
  const { data: requests } = await supabase
    .from('exchange_requests')
    .select(`
      *,
      exchange_items (*),
      profiles:user_id (display_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  const balance = await getUserBalance(user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ArrowLeftRight className="h-6 w-6" />
          交換管理
        </h1>
        <p className="text-muted-foreground">グッズ・特典割引の交換申請を管理します</p>
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            申請一覧
          </TabsTrigger>
          <TabsTrigger value="new" className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            新規申請
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          <ExchangeRequestList
            requests={requests ?? []}
            canManage={true}
            showUserInfo={true}
          />
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>交換を申請する</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
                利用可能残高: <span className="font-bold text-primary">{balance.available.toLocaleString()} SC</span>
              </div>
              <ExchangeRequestForm items={items ?? []} availableBalance={balance.available} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
