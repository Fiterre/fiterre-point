import { getTrainerShifts, DAY_OF_WEEK_LABELS } from '@/lib/queries/shifts'
import { getTrainers } from '@/lib/queries/reservations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function AdminShiftsPage() {
  const [shifts, trainers] = await Promise.all([
    getTrainerShifts(),
    getTrainers()
  ])

  // トレーナーごとにシフトをグループ化
  const shiftsByTrainer = trainers.map(trainer => ({
    trainer,
    shifts: shifts.filter(s => s.trainer_id === trainer.id)
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">シフト管理</h1>
          <p className="text-gray-600">トレーナーの勤務シフトを管理</p>
        </div>
        <Link href="/admin/shifts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            シフト追加
          </Button>
        </Link>
      </div>

      {/* トレーナー別シフト一覧 */}
      {shiftsByTrainer.map(({ trainer, shifts }) => (
        <Card key={trainer.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {trainer.profiles?.display_name || '名前未設定'}
              <Badge variant="outline">{trainer.specialty || 'トレーナー'}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shifts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">シフトが登録されていません</p>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map(day => {
                  const dayShifts = shifts.filter(s => s.day_of_week === day)
                  return (
                    <div key={day} className="text-center">
                      <div className={`font-medium mb-2 ${day === 0 ? 'text-red-600' : day === 6 ? 'text-blue-600' : ''}`}>
                        {DAY_OF_WEEK_LABELS[day]}
                      </div>
                      {dayShifts.length === 0 ? (
                        <div className="text-gray-300 text-sm">−</div>
                      ) : (
                        dayShifts.map(shift => (
                          <div key={shift.id} className="text-xs bg-amber-100 text-amber-800 rounded px-1 py-0.5 mb-1">
                            {shift.start_time.slice(0, 5)}〜{shift.end_time.slice(0, 5)}
                          </div>
                        ))
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {trainers.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            トレーナーが登録されていません
          </CardContent>
        </Card>
      )}
    </div>
  )
}
