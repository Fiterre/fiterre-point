import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const DEFAULT_PRESETS = [
  { id: '1', label: 'ライト', amount: 19000 },
  { id: '2', label: 'スタンダード', amount: 40000 },
  { id: '3', label: 'プレミアム', amount: 85000 },
  { id: '4', label: 'ボーナス', amount: 5000 },
]

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'coin_grant_presets')
      .maybeSingle()

    if (error) {
      console.error('Presets fetch error:', error)
      return NextResponse.json({ presets: DEFAULT_PRESETS })
    }

    if (data?.value) {
      try {
        const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
        if (Array.isArray(parsed) && parsed.length > 0) {
          return NextResponse.json({ presets: parsed })
        }
      } catch {
        // fallback
      }
    }

    return NextResponse.json({ presets: DEFAULT_PRESETS })
  } catch {
    return NextResponse.json({ presets: DEFAULT_PRESETS })
  }
}
