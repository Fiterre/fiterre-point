import { createClient } from '@/lib/supabase/server'
import { getSessionTypes, getTrainers } from '@/lib/queries/reservations'
import { getUserBalance } from '@/lib/queries/balance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ReservationForm from '@/components/features/reservations/ReservationForm'

export default async function NewReservationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [sessionTypes, trainers, balance] = await Promise.all([
    getSessionTypes(),
    getTrainers(),
    getUserBalance(user.id)
  ])

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/reservations" className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">新規予約</h1>
          <p className="text-gray-600">トレーニングを予約する</p>
        </div>
      </div>

      {/* 残高表示 */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <span className="text-amber-800">利用可能コイン</span>
            <span className="text-xl font-bold text-amber-600">
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
            trainers={trainers}
            availableBalance={balance.available}
          />
        </CardContent>
      </Card>
    </div>
  )
}
