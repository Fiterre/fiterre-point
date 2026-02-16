import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface BusinessClosure {
  id: string
  closure_date: string
  reason: string | null
  created_at: string
}

export async function getClosures(fromDate?: string) {
  const supabase = await createClient()

  const from = fromDate || new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('business_closures')
    .select('*')
    .gte('closure_date', from)
    .order('closure_date', { ascending: true })

  if (error) {
    console.error('Error fetching closures:', error)
    return []
  }

  return data ?? []
}

export async function addClosure(date: string, reason: string | null, userId: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('business_closures')
    .insert({
      closure_date: date,
      reason,
      created_by: userId
    })

  if (error) {
    if (error.code === '23505') {
      throw new Error('この日付は既に登録されています')
    }
    throw new Error('臨時休業の追加に失敗しました')
  }
}

export async function removeClosure(id: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('business_closures')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error('臨時休業の削除に失敗しました')
  }
}
