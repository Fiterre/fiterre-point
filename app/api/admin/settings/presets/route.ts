import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'

const DEFAULT_PRESETS = [
  { id: '1', label: 'ライト', amount: 19000 },
  { id: '2', label: 'スタンダード', amount: 40000 },
  { id: '3', label: 'プレミアム', amount: 85000 },
  { id: '4', label: 'ボーナス', amount: 5000 },
]

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const admin = await isAdmin(user.id)
  if (!admin) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

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
