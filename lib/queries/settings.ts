import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface SystemSetting {
  key: string
  value: any
  description: string | null
  category: string
  updated_at: string
}

export async function getSettings(category?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('system_settings')
    .select('*')
    .order('key')

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching settings:', error)
    return []
  }

  return data ?? []
}

export async function getSetting(key: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .single()

  if (error) {
    return null
  }

  return data?.value
}

export async function updateSetting(key: string, value: any, userId: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('system_settings')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })

  if (error) {
    throw new Error(`設定の更新に失敗しました: ${error.message}`)
  }
}

export async function updateSettings(settings: { key: string; value: any }[], userId: string) {
  const supabase = createAdminClient()

  for (const setting of settings) {
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key: setting.key,
        value: setting.value,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })

    if (error) {
      throw new Error(`設定 ${setting.key} の更新に失敗しました`)
    }
  }
}
