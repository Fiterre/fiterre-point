import { getSettings } from '@/lib/queries/settings'
import AppearanceForm from './AppearanceForm'

export default async function AppearanceTab() {
  const settings = await getSettings('appearance')

  const getSettingValue = (key: string, defaultValue: string) => {
    const setting = settings.find(s => s.key === key)
    if (!setting) return defaultValue
    const val = setting.value
    return typeof val === 'string' ? val.replace(/"/g, '') : String(val)
  }

  return (
    <AppearanceForm
      initialTheme={getSettingValue('theme_mode', 'system')}
      initialAccentColor={getSettingValue('accent_color', 'amber')}
      initialAppName={getSettingValue('app_name', 'Stella Coin')}
      initialLogoUrl={getSettingValue('logo_url', '')}
      initialFontSize={getSettingValue('font_size', 'normal')}
    />
  )
}
