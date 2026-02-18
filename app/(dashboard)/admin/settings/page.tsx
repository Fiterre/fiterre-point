import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Clock, Shield, Palette, Building, Zap, Coins } from 'lucide-react'
import SystemSettingsTab from '@/components/features/admin/settings/SystemSettingsTab'
import BusinessHoursTab from '@/components/features/admin/settings/BusinessHoursTab'
import PermissionsTab from '@/components/features/admin/settings/PermissionsTab'
import AppearanceTab from '@/components/features/admin/settings/AppearanceTab'
import GymInfoTab from '@/components/features/admin/settings/GymInfoTab'
import TriggerSettingsTab from '@/components/features/admin/settings/TriggerSettingsTab'
import CoinPresetsTab from '@/components/features/admin/settings/CoinPresetsTab'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">設定</h1>
        <p className="text-muted-foreground">システム設定・営業時間・権限・デザインの管理</p>
      </div>

      <Tabs defaultValue="system" className="w-full">
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">システム</span>
          </TabsTrigger>
          <TabsTrigger value="coins" className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            <span className="hidden sm:inline">コイン設定</span>
          </TabsTrigger>
          <TabsTrigger value="triggers" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">自動処理</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">営業時間</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">権限</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">デザイン</span>
          </TabsTrigger>
          <TabsTrigger value="gym" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">ジム情報</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="mt-6">
          <SystemSettingsTab />
        </TabsContent>

        <TabsContent value="coins" className="mt-6">
          <CoinPresetsTab />
        </TabsContent>

        <TabsContent value="triggers" className="mt-6">
          <TriggerSettingsTab />
        </TabsContent>

        <TabsContent value="hours" className="mt-6">
          <BusinessHoursTab />
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <PermissionsTab />
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <AppearanceTab />
        </TabsContent>

        <TabsContent value="gym" className="mt-6">
          <GymInfoTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
