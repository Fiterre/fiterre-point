import { getFitestItems } from '@/lib/queries/fitest'
import FitestItemsTab from './FitestItemsTab'

export default async function FitestTab() {
  const items = await getFitestItems()
  return <FitestItemsTab initialItems={items} />
}
