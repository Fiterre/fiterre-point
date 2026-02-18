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

    const body = await request.json()
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const lineUserId = typeof body.lineUserId === 'string' ? body.lineUserId.trim() : ''

    if (!displayName || !email) {
      return NextResponse.json({ error: '名前とメールアドレスは必須です' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // ========================================
    // Step 1: ユーザーを確保（既存 or 新規作成）
    // .maybeSingle() は0件でもエラーにならない（.single()はエラーになる）
    // ========================================
    const { data: existingProfile, error: profileLookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (profileLookupError) {
      throw new Error(`プロフィール検索に失敗: ${profileLookupError.message}`)
    }

    let userId: string

    if (existingProfile) {
      userId = existingProfile.id

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          ...(lineUserId !== '' ? { line_user_id: lineUserId } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (profileUpdateError) {
        throw new Error(`プロフィール更新に失敗: ${profileUpdateError.message}`)
      }
    } else {
      // Supabase Auth でユーザー作成
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { display_name: displayName },
      })

      if (authError) {
        throw new Error(`ユーザー作成に失敗: ${authError.message}`)
      }

      userId = authData.user.id

      // プロフィール作成（Auth triggerで作成済みの場合はupsert）
      const { error: profileUpsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email,
          display_name: displayName,
          ...(lineUserId !== '' ? { line_user_id: lineUserId } : {}),
          status: 'active',
          updated_at: new Date().toISOString(),
        })

      if (profileUpsertError) {
        throw new Error(`プロフィール作成に失敗: ${profileUpsertError.message}`)
      }
    }

    // ========================================
    // Step 2: mentorsテーブルに追加/更新
    // ========================================
    const { data: existingMentor } = await supabase
      .from('mentors')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingMentor) {
      const { error: mentorUpdateError } = await supabase
        .from('mentors')
        .update({
          name: displayName,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      if (mentorUpdateError) {
        throw new Error(`メンター更新に失敗: ${mentorUpdateError.message}`)
      }
    } else {
      const { error: mentorError } = await supabase
        .from('mentors')
        .insert({
          user_id: userId,
          name: displayName,
          is_active: true,
        })

      if (mentorError) {
        throw new Error(`メンター登録に失敗: ${mentorError.message}`)
      }
    }

    // ========================================
    // Step 3: user_rolesにmentor権限を付与
    // ※ upsertは使わない（UNIQUE制約の有無に依存しない安全な実装）
    // ========================================
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id, role')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingRole) {
      // admin/managerは上書きしない（より高い権限を維持）
      if (existingRole.role !== 'admin' && existingRole.role !== 'manager') {
        const { error: roleUpdateError } = await supabase
          .from('user_roles')
          .update({
            role: 'mentor',
            granted_by: user.id,
            granted_at: new Date().toISOString(),
          })
          .eq('id', existingRole.id)

        if (roleUpdateError) {
          throw new Error(`権限更新に失敗: ${roleUpdateError.message}`)
        }
      }
    } else {
      const { error: roleInsertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'mentor',
          granted_by: user.id,
          granted_at: new Date().toISOString(),
        })

      if (roleInsertError) {
        throw new Error(`権限付与に失敗: ${roleInsertError.message}`)
      }
    }

    // ========================================
    // Step 4: 検証 — 全ステップが成功したか確認
    // ========================================
    const { data: verifyRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

    if (!verifyRole || (verifyRole.role !== 'mentor' && verifyRole.role !== 'admin' && verifyRole.role !== 'manager')) {
      throw new Error('権限の付与を検証できませんでした。user_rolesテーブルを確認してください。')
    }

    const { data: verifyMentor } = await supabase
      .from('mentors')
      .select('id, is_active')
      .eq('user_id', userId)
      .maybeSingle()

    if (!verifyMentor || !verifyMentor.is_active) {
      throw new Error('メンターの有効化を検証できませんでした。mentorsテーブルを確認してください。')
    }

    return NextResponse.json({ success: true, userId })
  } catch (error) {
    console.error('Mentor create error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'サーバーエラー',
    }, { status: 500 })
  }
}
