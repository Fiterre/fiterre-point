'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Save, Plus, X, Calendar } from 'lucide-react'

interface DayHours {
  open: string
  close: string
  is_open: boolean
}

interface BusinessHours {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

interface Closure {
  id: string
  closure_date: string
  reason: string | null
}

interface Props {
  initialHours: BusinessHours
  initialInterval: number
  initialClosures: Closure[]
}

const DAY_LABELS: Record<string, string> = {
  monday: '月曜日',
  tuesday: '火曜日',
  wednesday: '水曜日',
  thursday: '木曜日',
  friday: '金曜日',
  saturday: '土曜日',
  sunday: '日曜日',
}

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export default function BusinessHoursForm({ initialHours, initialInterval, initialClosures }: Props) {
  const [hours, setHours] = useState<BusinessHours>(initialHours)
  const [interval, setInterval] = useState(initialInterval)
  const [closures, setClosures] = useState(initialClosures)
  const [newClosureDate, setNewClosureDate] = useState('')
  const [newClosureReason, setNewClosureReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleHoursChange = (day: string, field: keyof DayHours, value: string | boolean) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day as keyof BusinessHours], [field]: value }
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [
            { key: 'business_hours', value: hours },
            { key: 'slot_interval_minutes', value: interval }
          ]
        }),
      })

      if (!response.ok) {
        throw new Error('保存に失敗しました')
      }

      toast({ title: '保存完了', description: '営業時間を保存しました' })
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

  const handleAddClosure = async () => {
    if (!newClosureDate) return

    setLoading(true)

    try {
      const response = await fetch('/api/admin/settings/closures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newClosureDate,
          reason: newClosureReason || null
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '追加に失敗しました')
      }

      toast({ title: '追加完了', description: '臨時休業を追加しました' })
      setNewClosureDate('')
      setNewClosureReason('')
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

  const handleRemoveClosure = async (id: string) => {
    if (!confirm('この臨時休業を削除しますか？')) return

    try {
      const response = await fetch(`/api/admin/settings/closures?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('削除に失敗しました')
      }

      setClosures(prev => prev.filter(c => c.id !== id))
      toast({ title: '削除完了', description: '臨時休業を削除しました' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: error instanceof Error ? error.message : 'エラーが発生しました',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* 営業時間 */}
      <Card>
        <CardHeader>
          <CardTitle>営業時間</CardTitle>
          <CardDescription>曜日ごとの営業時間を設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAY_ORDER.map(day => (
            <div key={day} className="flex items-center gap-4 py-2 border-b last:border-0">
              <div className="w-20">
                <span className={`font-medium ${day === 'sunday' ? 'text-red-600' : day === 'saturday' ? 'text-blue-600' : ''}`}>
                  {DAY_LABELS[day]}
                </span>
              </div>
              <Switch
                checked={hours[day as keyof BusinessHours]?.is_open ?? true}
                onCheckedChange={(checked) => handleHoursChange(day, 'is_open', checked)}
              />
              <span className="text-sm text-gray-500 w-12">
                {hours[day as keyof BusinessHours]?.is_open ? '営業' : '休業'}
              </span>
              {hours[day as keyof BusinessHours]?.is_open && (
                <>
                  <Input
                    type="time"
                    value={hours[day as keyof BusinessHours]?.open || '09:00'}
                    onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                    className="w-32"
                  />
                  <span>〜</span>
                  <Input
                    type="time"
                    value={hours[day as keyof BusinessHours]?.close || '21:00'}
                    onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                    className="w-32"
                  />
                </>
              )}
            </div>
          ))}

          <div className="pt-4 border-t">
            <Label>予約枠の間隔</Label>
            <div className="flex items-center gap-2 mt-2">
              <select
                value={interval}
                onChange={(e) => { setInterval(Number(e.target.value)); setHasChanges(true) }}
                className="h-10 px-3 border rounded-md"
              >
                <option value={30}>30分</option>
                <option value={60}>60分</option>
                <option value={90}>90分</option>
              </select>
              <span className="text-sm text-gray-500">刻みで予約枠を表示</span>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={loading || !hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? '保存中...' : '営業時間を保存'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 臨時休業 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            臨時休業
          </CardTitle>
          <CardDescription>特定の日を休業日として設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 追加フォーム */}
          <div className="flex gap-2">
            <Input
              type="date"
              value={newClosureDate}
              onChange={(e) => setNewClosureDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-40"
            />
            <Input
              placeholder="理由（任意）"
              value={newClosureReason}
              onChange={(e) => setNewClosureReason(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddClosure} disabled={!newClosureDate || loading}>
              <Plus className="h-4 w-4 mr-2" />
              追加
            </Button>
          </div>

          {/* リスト */}
          {closures.length === 0 ? (
            <p className="text-center py-4 text-gray-500">臨時休業の予定はありません</p>
          ) : (
            <div className="space-y-2">
              {closures.map(closure => (
                <div key={closure.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {new Date(closure.closure_date).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </p>
                    {closure.reason && (
                      <p className="text-sm text-gray-500">{closure.reason}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveClosure(closure.id)}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
