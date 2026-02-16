import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { TrainingRecord, TrainingRecordWithRelations, Exercise } from '@/types/database'

export async function getUserRecords(
  userId: string,
  type?: 'daily' | 'monthly',
  limit: number = 50
): Promise<TrainingRecordWithRelations[]> {
  const supabase = await createClient()

  let query = supabase
    .from('training_records')
    .select(`
      *,
      mentors (
        profiles:user_id (
          display_name
        )
      )
    `)
    .eq('user_id', userId)
    .order('record_date', { ascending: false })
    .limit(limit)

  if (type) {
    query = query.eq('record_type', type)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching training records:', error)
    return []
  }

  return (data ?? []) as unknown as TrainingRecordWithRelations[]
}

export async function getRecordById(recordId: string): Promise<TrainingRecordWithRelations | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('training_records')
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
    .eq('id', recordId)
    .single()

  if (error) {
    console.error('Error fetching training record:', error)
    return null
  }

  return data as unknown as TrainingRecordWithRelations
}

export async function createRecord(
  userId: string,
  mentorId: string | null,
  sessionId: string | null,
  recordDate: string,
  recordType: 'daily' | 'monthly',
  content: string,
  title?: string,
  exercises?: Exercise[],
  notes?: string
): Promise<TrainingRecord | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('training_records')
    .insert({
      user_id: userId,
      mentor_id: mentorId,
      session_id: sessionId,
      record_date: recordDate,
      record_type: recordType,
      title,
      content,
      exercises: exercises || [],
      notes
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating training record:', error)
    return null
  }

  return data as TrainingRecord
}

export async function updateRecord(
  recordId: string,
  updates: {
    title?: string
    content?: string
    exercises?: Exercise[]
    notes?: string
  }
): Promise<boolean> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('training_records')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', recordId)

  if (error) {
    console.error('Error updating training record:', error)
    return false
  }

  return true
}

export async function deleteRecord(recordId: string): Promise<boolean> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('training_records')
    .delete()
    .eq('id', recordId)

  if (error) {
    console.error('Error deleting training record:', error)
    return false
  }

  return true
}

export async function getRecordsByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<TrainingRecordWithRelations[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('training_records')
    .select(`
      *,
      mentors (
        profiles:user_id (
          display_name
        )
      )
    `)
    .eq('user_id', userId)
    .gte('record_date', startDate)
    .lte('record_date', endDate)
    .order('record_date', { ascending: false })

  if (error) {
    console.error('Error fetching training records:', error)
    return []
  }

  return (data ?? []) as unknown as TrainingRecordWithRelations[]
}

export async function getMonthlyReports(
  userId: string,
  year?: number
): Promise<TrainingRecordWithRelations[]> {
  const supabase = await createClient()

  let query = supabase
    .from('training_records')
    .select(`
      *,
      mentors (
        profiles:user_id (
          display_name
        )
      )
    `)
    .eq('user_id', userId)
    .eq('record_type', 'monthly')
    .order('record_date', { ascending: false })

  if (year) {
    query = query
      .gte('record_date', `${year}-01-01`)
      .lte('record_date', `${year}-12-31`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching monthly reports:', error)
    return []
  }

  return (data ?? []) as unknown as TrainingRecordWithRelations[]
}

export async function getRecentMentorRecords(
  mentorUserId: string,
  limit: number = 20
): Promise<any[]> {
  const supabase = createAdminClient()

  // メンターIDを取得
  const { data: mentor } = await supabase
    .from('mentors')
    .select('id')
    .eq('user_id', mentorUserId)
    .single()

  if (!mentor) {
    // メンターでない場合は全記録を取得（管理者向け）
    const { data, error } = await supabase
      .from('training_records')
      .select(`
        *,
        profiles:user_id (
          display_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching records:', error)
      return []
    }

    return data ?? []
  }

  // メンターの場合は自分が作成した記録を取得
  const { data, error } = await supabase
    .from('training_records')
    .select(`
      *,
      profiles:user_id (
        display_name,
        email
      )
    `)
    .eq('mentor_id', mentor.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching mentor records:', error)
    return []
  }

  return data ?? []
}
