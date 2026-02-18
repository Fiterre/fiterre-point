import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier_level')
    .eq('id', user.id)
    .single()

  if (!profile || profile.tier_level > 2) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  // 全ページのキャッシュを無効化
  const paths = [
    '/',
    '/dashboard',
    '/admin',
    '/admin/users',
    '/admin/mentors',
    '/admin/shifts',
    '/admin/schedule',
    '/admin/recurring',
    '/admin/settings',
    '/admin/coins',
    '/admin/analytics',
  ]
  paths.forEach(p => revalidatePath(p))
  revalidatePath('/', 'layout')

  return NextResponse.json({ success: true, clearedAt: new Date().toISOString() })
}
