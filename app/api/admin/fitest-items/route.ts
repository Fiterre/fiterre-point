import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'

// 全項目取得
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const admin = await isAdmin(user.id)
  if (!admin) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('fitest_items')
    .select('*')
    .order('display_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// 新規作成
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const admin = await isAdmin(user.id)
  if (!admin) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

  const body = await request.json()
  const { name, description, icon, input_type, unit, scoring_method, max_score, display_order } = body

  if (!name || !input_type || !scoring_method) {
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('fitest_items')
    .insert({ name, description, icon, input_type, unit, scoring_method, max_score: max_score ?? 100, display_order: display_order ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
