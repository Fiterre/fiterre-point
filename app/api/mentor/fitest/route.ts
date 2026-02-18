import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isMentor } from '@/lib/queries/auth'
import { isValidUUID, isValidDate } from '@/lib/validation'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const mentorAuth = await isMentor(user.id)
    if (!mentorAuth) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // メンターIDを取得
    const { data: mentor } = await adminClient
      .from('mentors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const body = await request.json()

    // 入力バリデーション
    if (!body.userId || !isValidUUID(body.userId)) {
      return NextResponse.json({ error: '無効なユーザーIDです' }, { status: 400 })
    }
    if (!body.testDate || !isValidDate(body.testDate)) {
      return NextResponse.json({ error: '無効なテスト日付です' }, { status: 400 })
    }

    // 対象ユーザーの存在確認
    const { data: targetUser } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', body.userId)
      .maybeSingle()

    if (!targetUser) {
      return NextResponse.json({ error: '対象ユーザーが見つかりません' }, { status: 404 })
    }

    const { data, error } = await adminClient
      .from('fitest_results')
      .insert({
        user_id: body.userId,
        mentor_id: mentor?.id || null,
        test_date: body.testDate,
        current_level: body.currentLevel,
        target_level: body.targetLevel,
        memory_game_score: body.memoryGameScore,
        memory_game_accuracy: body.memoryGameAccuracy,
        memory_game_notes: body.memoryGameNotes,
        bench_press_1rm: body.benchPress1rm,
        squat_1rm: body.squat1rm,
        deadlift_1rm: body.deadlift1rm,
        big3_total: body.big3Total,
        big3_notes: body.big3Notes,
        weight_predicted: body.weightPredicted,
        weight_actual: body.weightActual,
        weight_difference: body.weightDifference,
        weight_notes: body.weightNotes,
        total_score: body.totalScore,
        passed: body.passed,
        overall_notes: body.overallNotes
      })
      .select()
      .single()

    if (error) {
      console.error('Fitest create error:', error)
      return NextResponse.json({ error: '結果の保存に失敗しました' }, { status: 500 })
    }

    // 合格した場合、ユーザーのランクを更新
    if (body.passed) {
      const rankMapping: Record<string, string> = {
        intermediate: 'silver',
        advanced: 'gold',
        master: 'diamond'
      }
      const newRank = rankMapping[body.targetLevel]

      if (newRank) {
        await adminClient
          .from('profiles')
          .update({ rank: newRank, updated_at: new Date().toISOString() })
          .eq('id', body.userId)
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Fitest API error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
