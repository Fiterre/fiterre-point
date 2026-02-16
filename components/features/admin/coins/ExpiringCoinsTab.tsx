import { getExpiringCoins, getExpiryStats } from '@/lib/queries/coins'
import ExpiringCoinsView from './ExpiringCoinsView'

export default async function ExpiringCoinsTab() {
  const [expiringCoins, stats] = await Promise.all([
    getExpiringCoins(30),
    getExpiryStats()
  ])

  return (
    <ExpiringCoinsView
      initialCoins={expiringCoins}
      stats={stats}
    />
  )
}
