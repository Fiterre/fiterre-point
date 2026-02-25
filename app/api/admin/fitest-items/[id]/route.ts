import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'
import { isValidUUID } from '@/lib/validation'

// 更新
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

    const admin = await isAdmin(user.id)
    if (!admin) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

    const { id } = await params
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: '無効なIDです' }, { status: 400 })
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: '無効なリクエスト形式です' }, { status: 400 })
    }

    // ホワイトリストで許可フィールドのみ更新（マス代入防止）
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (typeof body.name === 'string' && body.name.trim() !== '') {
      updateData.name = body.name.trim()
    }
    if (typeof body.description === 'string') {
      updateData.description = body.description
    }
    if (typeof body.is_active === 'boolean') {
      updateData.is_active = body.is_active
    }
    if (typeof body.display_order === 'number' && Number.isInteger(body.display_order) && body.display_order >= 0) {
      updateData.display_order = body.display_order
    }
    if (typeof body.coin_cost === 'number' && Number.isInteger(body.coin_cost) && body.coin_cost > 0 && body.coin_cost <= 999999) {
      updateData.coin_cost = body.coin_cost
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('fitest_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Fitest item update error:', error)
      return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'アイテムが見つかりません' }, { status: 404 })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('Fitest item PATCH error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}

// 削除（論理削除: is_active = false）
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

    const admin = await isAdmin(user.id)
    if (!admin) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

    const { id } = await params
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: '無効なIDです' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('fitest_items')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Fitest item delete error:', error)
      return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fitest item DELETE error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
