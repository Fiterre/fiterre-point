import { getAllTransactions, getTransactionStats } from '@/lib/queries/transactions'
import { getAllUsers } from '@/lib/queries/users'
import TransactionHistoryView from './TransactionHistoryView'

export default async function TransactionHistoryTab() {
  const [{ data: transactions, count }, stats, users] = await Promise.all([
    getAllTransactions(50),
    getTransactionStats(),
    getAllUsers()
  ])

  return (
    <TransactionHistoryView
      initialTransactions={transactions}
      totalCount={count}
      stats={stats}
      users={users}
    />
  )
}
