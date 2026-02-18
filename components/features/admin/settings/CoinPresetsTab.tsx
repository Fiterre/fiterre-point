import { getSetting } from '@/lib/queries/settings'
import CoinPresetsForm from './CoinPresetsForm'

export interface CoinPreset {
  id: string
  label: string
  amount: number
}

const DEFAULT_PRESETS: CoinPreset[] = [
  { id: '1', label: 'ライト', amount: 19000 },
  { id: '2', label: 'スタンダード', amount: 40000 },
  { id: '3', label: 'プレミアム', amount: 85000 },
  { id: '4', label: 'ボーナス', amount: 5000 },
]

export default async function CoinPresetsTab() {
  const raw = await getSetting('coin_grant_presets')

  let presets: CoinPreset[] = DEFAULT_PRESETS
  if (raw) {
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (Array.isArray(parsed) && parsed.length > 0) {
        presets = parsed
      }
    } catch {
      // fallback to defaults
    }
  }

  return <CoinPresetsForm initialPresets={presets} />
}
