import { createAdminClient } from '@/lib/supabase/admin'
import ExchangeItemsForm from './ExchangeItemsForm'
import type { ExchangeItem } from '@/types/database'

export default async function ExchangeItemsTab() {
  let items: ExchangeItem[] = []

  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('exchange_items')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('ExchangeItemsTab fetch error:', error)
    } else {
      items = data ?? []
    }
  } catch (err) {
    console.error('ExchangeItemsTab unexpected error:', err)
  }

  return <ExchangeItemsForm initialItems={items} />
}
