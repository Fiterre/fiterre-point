import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCode } from '@/lib/queries/checkIn'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { code } = await request.json()

    if (!code || code.length !== 6) {
      return NextResponse.json({ valid: false, message: '6桁のコードを入力してください' })
    }

    const result = await verifyCode(code)

    // ユーザー情報を追加
    if (result.valid && result.userId) {
      const adminClient = createAdminClient()
      const { data: profile } = await adminClient
        .from('profiles')
        .select('display_name, email, status')
        .eq('id', result.userId)
        .single()

      // ユーザーが見つからない、または停止中のチェックインを拒否
      if (!profile) {
        return NextResponse.json({
          valid: false,
          message: 'ユーザー情報が取得できません',
        })
      }

      if (profile.status !== 'active') {
        return NextResponse.json({
          valid: false,
          message: 'このユーザーは現在利用停止中です',
        })
      }

      return NextResponse.json({
        ...result,
        userName: profile?.display_name,
        userEmail: profile?.email
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json({ valid: false, message: 'サーバーエラー' }, { status: 500 })
  }
}
