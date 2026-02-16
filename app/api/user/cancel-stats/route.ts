import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCancelStats } from '@/lib/queries/cancellation'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const stats = await getCancelStats(user.id)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Cancel stats error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
