import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface SystemSetting {
  id: string
  key: string
  value: any
  created_at: string
  updated_at: string
}

export async function getSettings() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .order('key')

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

export async function updateSetting(key: string, value: any) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('system_settings')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' })

  if (error) {
    throw new Error(`設定の更新に失敗しました: ${error.message}`)
  }
}

export async function updateSettings(settings: { key: string; value: any }[]) {
  const supabase = createAdminClient()

  for (const setting of settings) {
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key: setting.key,
        value: setting.value,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' })

    if (error) {
      throw new Error(`設定 ${setting.key} の更新に失敗しました`)
    }
  }
}
