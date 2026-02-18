'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Save } from 'lucide-react'

interface Setting {
  key: string
  value: any
  description: string | null
}

interface Props {
  initialSettings: Setting[]
}

const SETTING_LABELS: Record<string, { label: string; description: string; unit?: string }> = {
  coin_expiry_days: {
    label: 'コイン有効期限',
    description: '付与されたコインが何日で期限切れになるか',
    unit: '日'
  },
  cancel_deadline_hours: {
    label: 'キャンセル期限（参考値）',
    description: '※ 現在はセッション前日の23:59が期限です',
    unit: '時間前'
  },
  booking_advance_days: {
    label: '予約可能日数',
    description: '何日先まで予約できるか',
    unit: '日先'
  },
  max_daily_reservations: {
    label: '1日の予約上限',
    description: '1ユーザーが1日に予約できる最大数',
    unit: '件'
  },
  max_concurrent_reservations: {
    label: '同時予約上限',
    description: '未消化の予約を何件まで持てるか',
    unit: '件'
  },
  no_show_penalty_percent: {
    label: 'ノーショーペナルティ',
    description: '無断欠席時のコイン没収率',
    unit: '%'
  },
  checkin_bonus_coins: {
    label: '来店ポイント',
    description: 'チェックイン時に付与されるポイント',
    unit: 'SC'
  },
  session_cost_default: {
    label: 'デフォルトセッションコスト',
    description: '標準的なセッションのコイン消費量',
    unit: 'SC'
  },
}

export default function SystemSettingsForm({ initialSettings }: Props) {
  const [settings, setSettings] = useState<Record<string, string>>(() => {
    const obj: Record<string, string> = {}
    initialSettings.forEach(s => {
      obj[s.key] = String(s.value).replace(/"/g, '')
    })
    return obj
  })
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: Object.entries(settings).map(([key, value]) => ({
            key,
            value: isNaN(Number(value)) ? value : Number(value)
          }))
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '保存に失敗しました')
      }

      toast({
        title: '保存完了',
        description: '設定を保存しました',
      })

      setHasChanges(false)
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: error instanceof Error ? error.message : 'エラーが発生しました',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>システム設定</CardTitle>
          <CardDescription>
            コインの有効期限や予約のルールを設定します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(SETTING_LABELS).map(([key, meta]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{meta.label}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={key}
                    type="number"
                    value={settings[key] || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="flex-1"
                  />
                  {meta.unit && (
                    <span className="text-sm text-gray-500 w-16">{meta.unit}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{meta.description}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={loading || !hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? '保存中...' : '設定を保存'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
