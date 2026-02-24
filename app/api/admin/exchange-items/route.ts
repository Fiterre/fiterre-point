import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/queries/auth'
import { isValidUUID } from '@/lib/validation'

export async function GET() {
  try {
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
    const { data, error } = await adminClient
      .from('exchange_items')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Exchange items fetch error:', error)
      return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ items: data ?? [] })
  } catch (error) {
    console.error('Exchange items API error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const admin = await isAdmin(user.id)
    if (!admin) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    let body: { items?: { id?: string; category: string; name: string; coin_cost: number; is_active?: boolean; display_order?: number }[] }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: '無効なリクエスト形式です' }, { status: 400 })
    }

    const { items } = body
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'items配列が必要です' }, { status: 400 })
    }

    // バリデーション
    for (const item of items) {
      if (!item.name?.trim()) {
        return NextResponse.json({ error: '項目名は必須です' }, { status: 400 })
      }
      if (!item.category || !['discount', 'goods'].includes(item.category)) {
        return NextResponse.json({ error: 'カテゴリは「割引」または「物品」を選択してください' }, { status: 400 })
      }
      if (!item.coin_cost || !Number.isInteger(item.coin_cost) || item.coin_cost <= 0 || item.coin_cost > 999999) {
        return NextResponse.json({ error: '必要SCは1〜999,999の整数を入力してください' }, { status: 400 })
      }
    }

    const adminClient = createAdminClient()

    // 既存アイテムを全て無効化し、送信されたアイテムで上書き
    // 既存のIDがある場合はupsert、ないものは新規作成
    const upsertItems = items.map((item, index) => ({
      ...(item.id ? { id: item.id } : {}),
      category: item.category,
      name: item.name.trim(),
      coin_cost: item.coin_cost,
      is_active: item.is_active !== false,
      display_order: index,
      updated_at: new Date().toISOString(),
    }))

    // 送信されたIDリストにないものを無効化（UUIDバリデーション）
    const existingIds = items.filter(i => i.id && isValidUUID(i.id)).map(i => i.id)

    if (existingIds.length > 0) {
      await adminClient
        .from('exchange_items')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .not('id', 'in', `(${existingIds.join(',')})`)
    } else {
      // 全部新規の場合、既存を全無効化
      await adminClient
        .from('exchange_items')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('is_active', true)
    }

    // upsert
    const { error } = await adminClient
      .from('exchange_items')
      .upsert(upsertItems)

    if (error) {
      console.error('Exchange items upsert error:', error)
      return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Exchange items API error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
