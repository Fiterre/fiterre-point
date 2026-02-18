import { createClient } from '@/lib/supabase/server'
import { getSessionTypes } from '@/lib/queries/reservations'
import { getUserBalance } from '@/lib/queries/balance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ReservationForm from '@/components/features/reservations/ReservationForm'

export default async function NewReservationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [sessionTypes, balance] = await Promise.all([
    getSessionTypes(),
    getUserBalance(user.id)
  ])

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/reservations" className="p-2 hover:bg-accent rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">新規予約</h1>
          <p className="text-muted-foreground">トレーニングを予約する</p>
        </div>
      </div>

      {/* 残高表示 */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <span className="text-primary">利用可能コイン</span>
            <span className="text-xl font-bold text-primary">
              {balance.available.toLocaleString()} SC
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 予約フォーム */}
      <Card>
        <CardHeader>
          <CardTitle>予約内容を選択</CardTitle>
        </CardHeader>
        <CardContent>
          <ReservationForm
            sessionTypes={sessionTypes}
            availableBalance={balance.available}
          />
        </CardContent>
      </Card>
    </div>
  )
}
