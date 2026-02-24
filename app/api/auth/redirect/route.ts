import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ path: '/login' })
  }

  const adminClient = createAdminClient()
  const { data: roleData } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  const role = roleData?.role || 'user'

  // ロールに応じたリダイレクト先
  let path = '/dashboard'
  if (role === 'admin' || role === 'manager') {
    path = '/admin'
  } else if (role === 'mentor') {
    path = '/mentor'
  }

  return NextResponse.json({ path })
}
