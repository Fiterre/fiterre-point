import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Coins, History, Clock } from 'lucide-react'
import BulkGrantTab from '@/components/features/admin/coins/BulkGrantTab'
import TransactionHistoryTab from '@/components/features/admin/coins/TransactionHistoryTab'
import ExpiringCoinsTab from '@/components/features/admin/coins/ExpiringCoinsTab'

export default function AdminCoinsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">コイン管理</h1>
        <p className="text-gray-600">コインの付与・履歴・期限管理</p>
      </div>

      <Tabs defaultValue="bulk-grant" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bulk-grant" className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            一括付与
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            取引履歴
          </TabsTrigger>
          <TabsTrigger value="expiring" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            期限切れ管理
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bulk-grant" className="mt-6">
          <BulkGrantTab />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <TransactionHistoryTab />
        </TabsContent>

        <TabsContent value="expiring" className="mt-6">
          <ExpiringCoinsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
