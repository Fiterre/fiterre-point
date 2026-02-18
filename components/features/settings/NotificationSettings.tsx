'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface Props {
  userId: string
}

interface NotificationPreferences {
  reservation_confirm: boolean
  reservation_reminder: boolean
  cancel_notify: boolean
  monthly_report: boolean
  promotion: boolean
}

export default function NotificationSettings({ userId }: Props) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    reservation_confirm: true,
    reservation_reminder: true,
    cancel_notify: true,
    monthly_report: true,
    promotion: false,
  })
  const { toast } = useToast()

  const handleChange = async (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }))

    // APIに保存（将来実装）
    toast({ title: '設定を保存しました' })
  }

  const settings = [
    { key: 'reservation_confirm', label: '予約確定通知', description: '予約が確定した時にお知らせ' },
    { key: 'reservation_reminder', label: '予約リマインダー', description: '予約の前日にお知らせ' },
    { key: 'cancel_notify', label: 'キャンセル通知', description: '予約がキャンセルされた時にお知らせ' },
    { key: 'monthly_report', label: '月次レポート', description: '毎月の成長記録をお知らせ' },
    { key: 'promotion', label: 'お得な情報', description: 'キャンペーンやイベント情報' },
  ]

  return (
    <div className="space-y-4">
      {settings.map(setting => (
        <div key={setting.key} className="flex items-center justify-between py-2">
          <div>
            <Label htmlFor={setting.key} className="font-medium">
              {setting.label}
            </Label>
            <p className="text-sm text-muted-foreground">{setting.description}</p>
          </div>
          <Switch
            id={setting.key}
            checked={preferences[setting.key as keyof NotificationPreferences]}
            onCheckedChange={(value) => handleChange(setting.key as keyof NotificationPreferences, value)}
          />
        </div>
      ))}
    </div>
  )
}
