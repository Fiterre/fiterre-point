import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const admin = await isAdmin(user.id)
    if (!admin) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const { start_at, end_at, is_all_day_block, block_reason, mentor_id } = await request.json()

    if (!start_at) {
      return NextResponse.json({ error: '開始日時は必須です' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('reservations')
      .insert({
        is_blocked: true,
        reserved_at: start_at,
        status: 'confirmed',
        is_all_day_block: is_all_day_block || false,
        block_reason: block_reason || null,
        mentor_id: mentor_id || null,
        user_id: null,
        coins_used: 0,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`ブロック作成に失敗しました: ${error.message}`)
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Block create error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'サーバーエラー',
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const admin = await isAdmin(user.id)
    if (!admin) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        mentors:mentor_id (
          profiles:user_id (
            display_name
          )
        )
      `)
      .eq('is_blocked', true)
      .order('reserved_at', { ascending: false })

    if (error) {
      throw new Error(`ブロック取得に失敗しました: ${error.message}`)
    }

    return NextResponse.json({ data: data ?? [] })
  } catch (error) {
    console.error('Block fetch error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'サーバーエラー',
    }, { status: 500 })
  }
}
