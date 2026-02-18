import { getMentors, getSessionTypes } from '@/lib/queries/reservations'
import { getAllUsers } from '@/lib/queries/users'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import RecurringReservationForm from '@/components/features/admin/RecurringReservationForm'

export default async function NewRecurringPage() {
  const [mentors, sessionTypes, users] = await Promise.all([
    getMentors(),
    getSessionTypes(),
    getAllUsers()
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/recurring" className="p-2 hover:bg-accent rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">固定予約追加</h1>
          <p className="text-muted-foreground">毎週繰り返す予約を登録</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>固定予約情報</CardTitle>
        </CardHeader>
        <CardContent>
          <RecurringReservationForm
            mentors={mentors}
            sessionTypes={sessionTypes}
            users={users}
          />
        </CardContent>
      </Card>
    </div>
  )
}
