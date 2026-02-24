import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cancelReservation, canCancelReservation } from '@/lib/queries/cancellation'
import { revalidatePath } from 'next/cache'
import { isValidUUID } from '@/lib/validation'

interface Props {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: Props) {
  try {
    const { id: reservationId } = await params

    if (!isValidUUID(reservationId)) {
      return NextResponse.json({ error: '無効な予約IDです' }, { status: 400 })
    }

    // ユーザー認証
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { reason } = await request.json().catch(() => ({}))

    // キャンセル実行
    const result = await cancelReservation(reservationId, user.id, reason)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    revalidatePath('/dashboard')
    revalidatePath('/admin')
    revalidatePath('/mentor')

    return NextResponse.json(result)
  } catch (error) {
    console.error('Cancel API error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}

export async function GET(_request: Request, { params }: Props) {
  try {
    const { id: reservationId } = await params

    if (!isValidUUID(reservationId)) {
      return NextResponse.json({ error: '無効な予約IDです' }, { status: 400 })
    }

    // ユーザー認証
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // キャンセル可否チェック
    const result = await canCancelReservation(reservationId, user.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Cancel check API error:', error)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
