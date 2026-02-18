import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 権限チェック共通
async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier_level')
    .eq('id', user.id)
    .single()

  if (!profile || profile.tier_level > 2) return null
  return user
}

// 全項目取得
export async function GET() {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

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
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

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
