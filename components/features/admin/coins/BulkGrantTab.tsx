import { getAllUsers } from '@/lib/queries/users'
import BulkGrantForm from './BulkGrantForm'

export default async function BulkGrantTab() {
  const users = await getAllUsers()

  return <BulkGrantForm users={users} />
}
