import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkIn } from '@/lib/queries/checkIn'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { userId, reservationId, codeId, method } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 })
    }

    const result = await checkIn(
      userId,
      user.id,
      method || 'manual',
      reservationId,
      codeId
    )

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
