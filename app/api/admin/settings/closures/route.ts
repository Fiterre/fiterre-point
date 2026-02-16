import { NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'
import { addClosure, removeClosure } from '@/lib/queries/businessHours'

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

    const { date, reason } = await request.json()

    if (!date) {
      return NextResponse.json({ error: '日付が必要です' }, { status: 400 })
    }

    await addClosure(date, reason, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Add closure error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'サーバーエラー'
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const admin = await isAdmin(user.id)
    if (!admin) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'IDが必要です' }, { status: 400 })
    }

    await removeClosure(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove closure error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'サーバーエラー'
    }, { status: 500 })
  }
}
