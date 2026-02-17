import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: '連携コードが必要です' }, { status: 400 })
    }

    // コードからLINEユーザーIDを取得
    // 実際の運用では、LINE Botが発行したコードとline_user_idのマッピングテーブルを参照
    // 今回は簡易実装として、コードをそのままline_user_idとして扱う
    const lineUserId = code.trim()

    const adminClient = createAdminClient()

    // 既に別のユーザーが使用していないか確認
    const { data: existing } = await adminClient
      .from('profiles')
      .select('id')
      .eq('line_user_id', lineUserId)
      .neq('id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'このLINEアカウントは既に別のユーザーに連携されています' }, { status: 400 })
    }

    // LINE IDを保存
    const { error } = await adminClient
      .from('profiles')
      .update({
        line_user_id: lineUserId,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      throw new Error('連携に失敗しました')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('LINE connect error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'サーバーエラー'
    }, { status: 500 })
  }
}
