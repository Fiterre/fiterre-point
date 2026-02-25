import { getAllUsers } from '@/lib/queries/users'
import BulkGrantForm from './BulkGrantForm'

export default async function BulkGrantTab() {
  const users = await getAllUsers()

  // SC付与対象: 一般ユーザー (role='user') のみ。mentor/admin/manager を除外
  // user_roles は Supabase が配列で返すため、配列として扱う
  const customerUsers = users.filter(u => {
    const roles = u.user_roles as { role: string }[]
    if (!roles || roles.length === 0) return true
    return roles[0].role === 'user'
  })

  return <BulkGrantForm users={customerUsers} />
}
