import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

// 更新
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

  const { id } = await params
  const body = await request.json()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('fitest_items')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// 削除（論理削除: is_active = false）
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

  const { id } = await params

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('fitest_items')
    .update({ is_active: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
