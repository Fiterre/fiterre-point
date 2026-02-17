import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('profiles')
      .update({
        line_user_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      throw new Error('解除に失敗しました')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('LINE disconnect error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'サーバーエラー'
    }, { status: 500 })
  }
}
