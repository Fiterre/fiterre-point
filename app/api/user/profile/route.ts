import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { display_name } = await request.json()

    if (typeof display_name !== 'string' || display_name.trim().length === 0) {
      return NextResponse.json({ error: '表示名を入力してください' }, { status: 400 })
    }

    if (display_name.trim().length > 50) {
      return NextResponse.json({ error: '表示名は50文字以内で入力してください' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('profiles')
      .update({ display_name: display_name.trim() })
      .eq('id', user.id)

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({ error: 'プロフィールの更新に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
