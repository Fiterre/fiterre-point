import { getSettings } from '@/lib/queries/settings'
import SystemSettingsForm from './SystemSettingsForm'

export default async function SystemSettingsTab() {
  const settings = await getSettings()

  return <SystemSettingsForm initialSettings={settings} />
}
