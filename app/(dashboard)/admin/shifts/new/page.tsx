import { getMentors } from '@/lib/queries/reservations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ShiftForm from '@/components/features/admin/ShiftForm'

export default async function NewShiftPage() {
  const mentors = await getMentors()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/shifts" className="p-2 hover:bg-accent rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">シフト追加</h1>
          <p className="text-muted-foreground">メンターのシフトを登録</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>シフト情報</CardTitle>
        </CardHeader>
        <CardContent>
          <ShiftForm mentors={mentors} />
        </CardContent>
      </Card>
    </div>
  )
}
