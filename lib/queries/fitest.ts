import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FitestResult, FitestResultWithRelations, FitestMilestone, FitestLevel } from '@/types/database'

export async function getUserFitestResults(userId: string): Promise<FitestResultWithRelations[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('fitest_results')
    .select(`
      *,
      mentors (
        profiles:user_id (
          display_name
        )
      )
    `)
    .eq('user_id', userId)
    .order('test_date', { ascending: false })

  if (error) {
    console.error('Error fetching fitest results:', error)
    return []
  }

  return (data ?? []) as unknown as FitestResultWithRelations[]
}

export async function getFitestResultById(resultId: string): Promise<FitestResultWithRelations | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('fitest_results')
    .select(`
      *,
      profiles:user_id (
        display_name,
        email
      ),
      mentors (
        profiles:user_id (
          display_name
        )
      )
    `)
    .eq('id', resultId)
    .single()

  if (error) {
    console.error('Error fetching fitest result:', error)
    return null
  }

  return data as unknown as FitestResultWithRelations
}

export async function getLatestFitestResult(userId: string): Promise<FitestResult | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('fitest_results')
    .select('*')
    .eq('user_id', userId)
    .order('test_date', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    return null
  }

  return data as FitestResult
}

export async function getMilestones(): Promise<FitestMilestone[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('fitest_milestones')
    .select('*')
    .eq('is_active', true)
    .order('from_level')

  if (error) {
    console.error('Error fetching milestones:', error)
    return []
  }

  return data ?? []
}

export async function getMilestoneForLevel(
  fromLevel: FitestLevel,
  toLevel: FitestLevel
): Promise<FitestMilestone | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('fitest_milestones')
    .select('*')
    .eq('from_level', fromLevel)
    .eq('to_level', toLevel)
    .eq('is_active', true)
    .single()

  if (error) {
    return null
  }

  return data as FitestMilestone
}

export async function createFitestResult(
  data: Omit<FitestResult, 'id' | 'created_at' | 'updated_at'>
): Promise<FitestResult | null> {
  const supabase = createAdminClient()

  const { data: result, error } = await supabase
    .from('fitest_results')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('Error creating fitest result:', error)
    return null
  }

  return result as FitestResult
}

export function calculateTotalScore(result: Partial<FitestResult>): number {
  let score = 0

  // 神経衰弱スコア（0-100点）
  if (result.memory_game_score) {
    score += Math.min(result.memory_game_score, 100)
  }

  // Big3スコア（総重量に応じて0-100点）
  if (result.big3_total) {
    // 300kg以上で100点、100kg以下で0点として計算
    score += Math.min(Math.max((result.big3_total - 100) / 2, 0), 100)
  }

  // 体重予測精度（誤差が少ないほど高得点、0-100点）
  if (result.weight_difference !== null && result.weight_difference !== undefined) {
    const diff = Math.abs(result.weight_difference)
    // 誤差0kgで100点、誤差5kg以上で0点
    score += Math.max(100 - (diff * 20), 0)
  }

  return Math.round(score)
}

export function checkPassStatus(
  result: Partial<FitestResult>,
  milestone: FitestMilestone
): boolean {
  // 神経衰弱スコアチェック
  if (milestone.min_memory_score &&
      (!result.memory_game_score || result.memory_game_score < milestone.min_memory_score)) {
    return false
  }

  // Big3トータルチェック
  if (milestone.min_big3_total &&
      (!result.big3_total || result.big3_total < milestone.min_big3_total)) {
    return false
  }

  // 体重予測精度チェック
  if (milestone.max_weight_difference !== null &&
      result.weight_difference !== null &&
      result.weight_difference !== undefined &&
      Math.abs(result.weight_difference) > milestone.max_weight_difference!) {
    return false
  }

  // 総合スコアチェック
  if (milestone.min_total_score &&
      (!result.total_score || result.total_score < milestone.min_total_score)) {
    return false
  }

  return true
}

export async function getNextFitestDate(userId: string): Promise<Date | null> {
  const latestResult = await getLatestFitestResult(userId)

  if (!latestResult) {
    return null
  }

  // 最後のテストから30日後を次回予定とする
  const lastTestDate = new Date(latestResult.test_date)
  const nextDate = new Date(lastTestDate)
  nextDate.setDate(nextDate.getDate() + 30)

  return nextDate
}

export async function getRecentFitestResults(limit: number = 20): Promise<any[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('fitest_results')
    .select(`
      *,
      profiles:user_id (
        display_name,
        email
      )
    `)
    .order('test_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent fitest results:', error)
    return []
  }

  return data ?? []
}
