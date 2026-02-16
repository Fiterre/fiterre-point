import { createAdminClient } from '@/lib/supabase/admin'

export interface CustomerDetails {
  subscription: {
    plan_name: string
    price_jpy: number
    status: string
    current_period_end: string | null
  } | null
  lastFitestDate: string | null
  lastLoginAt: string | null
}

export async function getCustomerDetails(userId: string): Promise<CustomerDetails> {
  const supabase = createAdminClient()

  // サブスクリプション情報
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select(`
      status,
      current_period_end,
      subscription_plans (
        name,
        price_jpy
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  // 最後のFitest日（将来実装用にnull）
  const lastFitestDate = null

  // 最終ログイン日（auth.usersから取得できないためnull）
  const lastLoginAt = null

  return {
    subscription: subscription ? {
      plan_name: (subscription.subscription_plans as any)?.name || '不明',
      price_jpy: (subscription.subscription_plans as any)?.price_jpy || 0,
      status: subscription.status,
      current_period_end: subscription.current_period_end
    } : null,
    lastFitestDate,
    lastLoginAt
  }
}
