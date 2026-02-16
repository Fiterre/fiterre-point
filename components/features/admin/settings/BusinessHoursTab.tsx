import { getSettings } from '@/lib/queries/settings'
import { getClosures } from '@/lib/queries/businessHours'
import BusinessHoursForm from './BusinessHoursForm'

export default async function BusinessHoursTab() {
  const [settings, closures] = await Promise.all([
    getSettings('hours'),
    getClosures()
  ])

  const businessHours = settings.find(s => s.key === 'business_hours')?.value || {}
  const slotInterval = settings.find(s => s.key === 'slot_interval_minutes')?.value || 60

  return (
    <BusinessHoursForm
      initialHours={businessHours}
      initialInterval={Number(slotInterval)}
      initialClosures={closures}
    />
  )
}
