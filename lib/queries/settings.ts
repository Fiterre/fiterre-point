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

// テーマ設定をadminClient経由で取得（認証不要・レイアウト用）
export async function getThemeSettings(): Promise<{
  theme_mode: string
  accent_color: string
  font_size: string
}> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', ['theme_mode', 'accent_color', 'font_size'])

  if (error) {
    console.error('Error fetching theme settings:', error)
    return { theme_mode: 'system', accent_color: 'amber', font_size: 'normal' }
  }

  const settings = Object.fromEntries(data?.map(s => [s.key, s.value]) ?? [])

  return {
    theme_mode: settings.theme_mode || 'system',
    accent_color: settings.accent_color || 'amber',
    font_size: settings.font_size || 'normal',
  }
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
