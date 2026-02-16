import { getCurrentUser } from '@/lib/queries/auth'
import { getAllUsers } from '@/lib/queries/users'
import { redirect } from 'next/navigation'
import RecordForm from '@/components/features/mentor/RecordForm'

interface Props {
  searchParams: Promise<{ type?: string; userId?: string }>
}

export default async function NewRecordPage({ searchParams }: Props) {
  const { type, userId } = await searchParams
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const users = await getAllUsers()
  const recordType = type === 'monthly' ? 'monthly' : 'daily'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {recordType === 'monthly' ? '月次レポート作成' : 'トレーニングログ追加'}
        </h1>
        <p className="text-gray-600">
          {recordType === 'monthly'
            ? '顧客の1ヶ月の成長をまとめます'
            : 'セッション内容を記録します'
          }
        </p>
      </div>

      <RecordForm
        mentorId={user.id}
        users={users}
        recordType={recordType}
        preselectedUserId={userId}
      />
    </div>
  )
}
