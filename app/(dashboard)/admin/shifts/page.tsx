export const dynamic = 'force-dynamic'

import { getMentorShifts, DAY_OF_WEEK_LABELS } from '@/lib/queries/shifts'
import { getMentors } from '@/lib/queries/reservations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import ShiftDeleteButton from '@/components/features/admin/ShiftDeleteButton'

export default async function AdminShiftsPage() {
  const [shifts, mentors] = await Promise.all([
    getMentorShifts(),
    getMentors()
  ])

  // メンターごとにシフトをグループ化
  const shiftsByMentor = mentors.map(mentor => ({
    mentor,
    shifts: shifts.filter(s => s.mentor_id === mentor.id)
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">シフト管理</h1>
          <p className="text-muted-foreground">メンターの勤務シフトを管理</p>
        </div>
        <Link href="/admin/shifts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            シフト追加
          </Button>
        </Link>
      </div>

      {/* メンター別シフト一覧 */}
      {shiftsByMentor.map(({ mentor, shifts }) => (
        <Card key={mentor.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {mentor.profiles?.display_name || '名前未設定'}
              <Badge variant="outline">メンター</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shifts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">シフトが登録されていません</p>
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
                        <div className="text-muted-foreground/50 text-sm">−</div>
                      ) : (
                        dayShifts.map(shift => (
                          <div key={shift.id} className="text-xs bg-primary/10 text-primary rounded px-1 py-0.5 mb-1 flex items-center justify-between gap-1">
                            <span>{shift.start_time.slice(0, 5)}〜{shift.end_time.slice(0, 5)}</span>
                            <ShiftDeleteButton shiftId={shift.id} />
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

      {mentors.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            メンターが登録されていません
          </CardContent>
        </Card>
      )}
    </div>
  )
}
