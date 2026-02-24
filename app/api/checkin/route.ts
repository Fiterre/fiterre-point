import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkIn } from '@/lib/queries/checkIn'
import { isMentor } from '@/lib/queries/auth'
import { isValidUUID } from '@/lib/validation'

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

    if (!isValidUUID(userId)) {
      return NextResponse.json({ error: '無効なユーザーIDです' }, { status: 400 })
    }

    // 他ユーザーのチェックインはメンター/管理者のみ可能（IDOR防止）
    if (userId !== user.id) {
      const mentorOrAdmin = await isMentor(user.id)
      if (!mentorOrAdmin) {
        return NextResponse.json({ error: '権限がありません' }, { status: 403 })
      }
    }

    // チェックイン対象ユーザーのステータス確認
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('profiles')
      .select('status')
      .eq('id', userId)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    if (profile.status !== 'active') {
      return NextResponse.json({ error: 'このユーザーは現在利用停止中です' }, { status: 403 })
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
