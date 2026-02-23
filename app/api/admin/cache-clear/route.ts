import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const admin = await isAdmin(user.id)
  if (!admin) return NextResponse.json({ error: '権限がありません' }, { status: 403 })

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
    '/admin/fitest-items',
    '/mentor',
  ]
  paths.forEach(p => revalidatePath(p))
  revalidatePath('/', 'layout')

  return NextResponse.json({ success: true, clearedAt: new Date().toISOString() })
}
