import { createAdminClient } from '@/lib/supabase/admin'
import ExchangeItemsForm from './ExchangeItemsForm'
import type { ExchangeItem } from '@/types/database'

export default async function ExchangeItemsTab() {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('exchange_items')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const items: ExchangeItem[] = data ?? []

  return <ExchangeItemsForm initialItems={items} />
}
