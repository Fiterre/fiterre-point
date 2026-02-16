import { getTrainers } from '@/lib/queries/reservations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ShiftForm from '@/components/features/admin/ShiftForm'

export default async function NewShiftPage() {
  const trainers = await getTrainers()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/shifts" className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">シフト追加</h1>
          <p className="text-gray-600">トレーナーのシフトを登録</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>シフト情報</CardTitle>
        </CardHeader>
        <CardContent>
          <ShiftForm trainers={trainers} />
        </CardContent>
      </Card>
    </div>
  )
}
