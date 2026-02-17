import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createVerificationCode } from '@/lib/queries/checkIn'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const code = await createVerificationCode(user.id)

    if (!code) {
      return NextResponse.json({ error: 'コードの生成に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({
      code: code.code,
      expiresAt: code.expires_at
    })
  } catch (error) {
    console.error('Generate code error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
