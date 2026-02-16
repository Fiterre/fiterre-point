import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/queries/auth'
import { getUserPermissions, getUserTier } from '@/lib/queries/permissions'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const [tier, permissions] = await Promise.all([
      getUserTier(user.id),
      getUserPermissions(user.id)
    ])

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      role: tier?.role || 'user',
      tier: tier?.tier || null,
      permissions: permissions
    })
  } catch (error) {
    console.error('Permissions API error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
