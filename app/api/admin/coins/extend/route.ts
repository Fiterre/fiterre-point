import { NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'
import { bulkExtendExpiry } from '@/lib/queries/coins'

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

    const { ledgerIds, additionalDays } = await request.json()

    if (!ledgerIds || ledgerIds.length === 0 || !additionalDays) {
      return NextResponse.json({ error: '無効なパラメータです' }, { status: 400 })
    }

    const results = await bulkExtendExpiry(ledgerIds, additionalDays)

    return NextResponse.json({
      success: results.success,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
    })
  } catch (error) {
    console.error('Extend expiry error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
