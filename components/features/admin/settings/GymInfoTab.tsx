import { getSettings } from '@/lib/queries/settings'
import GymInfoForm from './GymInfoForm'

export default async function GymInfoTab() {
  const settings = await getSettings()

  const gymSettings: Record<string, string> = {}
  settings.forEach(s => {
    const value = s.value
    gymSettings[s.key] = typeof value === 'string' ? value.replace(/^"|"$/g, '') : String(value)
  })

  return <GymInfoForm initialSettings={gymSettings} />
}
