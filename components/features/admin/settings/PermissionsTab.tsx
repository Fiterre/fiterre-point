import { getAllTiers } from '@/lib/queries/permissions'
import PermissionsForm from './PermissionsForm'

export default async function PermissionsTab() {
  const tiers = await getAllTiers()

  return <PermissionsForm initialTiers={tiers} />
}
