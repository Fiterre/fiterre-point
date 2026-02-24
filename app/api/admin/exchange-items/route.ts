import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/queries/auth'
import { isValidUUID } from '@/lib/validation'
import { revalidatePath } from 'next/cache'

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
      return NextResponse.json({ error: `取得に失敗しました: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ items: data ?? [] })
  } catch (error) {
    console.error('Exchange items API error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'サーバーエラー' }, { status: 500 })
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

    let body: { items?: { id?: string; category: string; name: string; coin_cost: number }[] }
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
    const now = new Date().toISOString()

    // Step 1: 現在アクティブなアイテムを全て無効化
    const { error: deactivateError } = await adminClient
      .from('exchange_items')
      .update({ is_active: false, updated_at: now })
      .eq('is_active', true)

    if (deactivateError) {
      console.error('Exchange items deactivate error:', deactivateError)
      return NextResponse.json({ error: `無効化に失敗: ${deactivateError.message}` }, { status: 500 })
    }

    // Step 2: 送信されたアイテムを INSERT（新規）または UPDATE（既存）で保存
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const itemData = {
        category: item.category,
        name: item.name.trim(),
        coin_cost: item.coin_cost,
        is_active: true,
        display_order: i,
        updated_at: now,
      }

      if (item.id && isValidUUID(item.id)) {
        // 既存アイテムを更新
        const { error } = await adminClient
          .from('exchange_items')
          .update(itemData)
          .eq('id', item.id)

        if (error) {
          console.error('Exchange item update error:', error)
          return NextResponse.json({ error: `更新に失敗: ${error.message}` }, { status: 500 })
        }
      } else {
        // 新規アイテムを挿入
        const { error } = await adminClient
          .from('exchange_items')
          .insert(itemData)

        if (error) {
          console.error('Exchange item insert error:', error)
          return NextResponse.json({ error: `追加に失敗: ${error.message}` }, { status: 500 })
        }
      }
    }

    revalidatePath('/admin/settings')
    revalidatePath('/dashboard/exchanges')
    revalidatePath('/mentor/exchanges')
    revalidatePath('/admin/exchanges')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Exchange items API error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'サーバーエラー' }, { status: 500 })
  }
}
