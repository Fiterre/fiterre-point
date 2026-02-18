import { getCurrentUser } from '@/lib/queries/auth'
import { getAllUsers } from '@/lib/queries/users'
import { getMilestones } from '@/lib/queries/fitest'
import { redirect } from 'next/navigation'
import FitestForm from '@/components/features/fitest/FitestForm'

interface Props {
  searchParams: Promise<{ userId?: string }>
}

export default async function NewFitestPage({ searchParams }: Props) {
  const { userId } = await searchParams
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const [users, milestones] = await Promise.all([
    getAllUsers(),
    getMilestones()
  ])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fitest実施</h1>
        <p className="text-muted-foreground">昇格試験の結果を入力します</p>
      </div>

      <FitestForm
        mentorId={user.id}
        users={users}
        milestones={milestones}
        preselectedUserId={userId}
      />
    </div>
  )
}
