import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const admin = await isAdmin(user.id)
    if (!admin) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const { displayName, email, lineUserId } = await request.json()

    if (!displayName || !email) {
      return NextResponse.json({ error: '名前とメールアドレスは必須です' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. メールアドレスでprofilesを検索
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    let userId: string

    if (existingProfile) {
      userId = existingProfile.id

      // プロフィール更新
      await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          ...(lineUserId ? { line_user_id: lineUserId } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
    } else {
      // 2. Supabase Auth でユーザー作成
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { display_name: displayName },
      })

      if (authError) {
        throw new Error(`ユーザー作成に失敗しました: ${authError.message}`)
      }

      userId = authData.user.id

      // プロフィール更新（Auth hookで作成済みの場合）
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email,
          display_name: displayName,
          ...(lineUserId ? { line_user_id: lineUserId } : {}),
          status: 'active',
          updated_at: new Date().toISOString(),
        })
    }

    // 3. mentorsテーブルに追加
    const { data: existingMentor } = await supabase
      .from('mentors')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existingMentor) {
      // 既にメンターの場合は有効化
      await supabase
        .from('mentors')
        .update({
          name: displayName,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    } else {
      const { error: mentorError } = await supabase
        .from('mentors')
        .insert({
          user_id: userId,
          name: displayName,
          is_active: true,
        })

      if (mentorError) {
        throw new Error(`メンター登録に失敗しました: ${mentorError.message}`)
      }
    }

    // 4. user_rolesにmentor権限を付与
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existingRole) {
      await supabase
        .from('user_roles')
        .update({
          role: 'mentor',
          granted_by: user.id,
          granted_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    } else {
      await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'mentor',
          granted_by: user.id,
        })
    }

    return NextResponse.json({ success: true, userId })
  } catch (error) {
    console.error('Mentor create error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'サーバーエラー',
    }, { status: 500 })
  }
}
