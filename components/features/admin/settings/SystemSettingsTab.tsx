import { getSettings } from '@/lib/queries/settings'
import SystemSettingsForm from './SystemSettingsForm'

export default async function SystemSettingsTab() {
  const settings = await getSettings('system')

  return <SystemSettingsForm initialSettings={settings} />
}
