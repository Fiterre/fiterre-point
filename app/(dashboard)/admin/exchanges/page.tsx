export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'
import { redirect } from 'next/navigation'
import { ArrowLeftRight } from 'lucide-react'
import ExchangeRequestList from '@/components/features/exchanges/ExchangeRequestList'

export default async function AdminExchangesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const admin = await isAdmin(user.id)
  if (!admin) redirect('/dashboard')

  const supabase = createAdminClient()

  const { data: requests } = await supabase
    .from('exchange_requests')
    .select(`
      *,
      exchange_items (*),
      profiles:user_id (display_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ArrowLeftRight className="h-6 w-6" />
          交換管理
        </h1>
        <p className="text-muted-foreground">グッズ・特典割引の交換申請を管理します</p>
      </div>

      <ExchangeRequestList
        requests={requests ?? []}
        canManage={true}
        canComplete={true}
        showUserInfo={true}
      />
    </div>
  )
}
