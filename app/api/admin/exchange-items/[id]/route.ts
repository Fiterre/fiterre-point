import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/queries/auth'
import { isValidUUID } from '@/lib/validation'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: '無効なIDです' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const admin = await isAdmin(user.id)
    if (!admin) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: '無効なリクエスト形式です' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (typeof body.is_active === 'boolean') updateData.is_active = body.is_active
    if (typeof body.name === 'string') {
      const trimmed = body.name.trim()
      if (!trimmed) return NextResponse.json({ error: '名前は空にできません' }, { status: 400 })
      updateData.name = trimmed
    }
    if (typeof body.category === 'string') {
      if (!['discount', 'goods'].includes(body.category)) {
        return NextResponse.json({ error: '無効なカテゴリです' }, { status: 400 })
      }
      updateData.category = body.category
    }
    if (body.coin_cost !== undefined) {
      if (typeof body.coin_cost !== 'number' || !Number.isInteger(body.coin_cost) || body.coin_cost <= 0) {
        return NextResponse.json({ error: 'coin_costは正の整数である必要があります' }, { status: 400 })
      }
      updateData.coin_cost = body.coin_cost
    }

    const { error } = await adminClient
      .from('exchange_items')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Exchange item update error:', error)
      return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Exchange item API error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: '無効なIDです' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const admin = await isAdmin(user.id)
    if (!admin) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // 申請中のリクエストがある場合は削除不可（無効化のみ）
    const { count } = await adminClient
      .from('exchange_requests')
      .select('*', { count: 'exact', head: true })
      .eq('exchange_item_id', id)
      .in('status', ['requested', 'ordering'])

    if (count && count > 0) {
      // 進行中の申請がある場合は無効化のみ
      await adminClient
        .from('exchange_items')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      return NextResponse.json({ success: true, deactivated: true })
    }

    const { error } = await adminClient
      .from('exchange_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Exchange item delete error:', error)
      return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Exchange item API error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
