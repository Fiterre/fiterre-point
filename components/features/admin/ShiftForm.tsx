'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface Trainer {
  id: string
  profiles: {
    display_name: string | null
  }
}

interface Props {
  trainers: Trainer[]
}

const DAY_LABELS = ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜']
const TIME_OPTIONS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
]

export default function ShiftForm({ trainers }: Props) {
  const [trainerId, setTrainerId] = useState('')
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!trainerId || selectedDays.length === 0) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: 'トレーナーと曜日を選択してください',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerId,
          days: selectedDays,
          startTime,
          endTime,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'シフト登録に失敗しました')
      }

      toast({
        title: '登録完了',
        description: `${selectedDays.length}件のシフトを登録しました`,
      })

      router.push('/admin/shifts')
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* トレーナー選択 */}
      <div className="space-y-2">
        <Label>トレーナー</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {trainers.map(trainer => (
            <div
              key={trainer.id}
              onClick={() => setTrainerId(trainer.id)}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                trainerId === trainer.id
                  ? 'border-amber-500 bg-amber-50'
                  : 'hover:border-gray-300'
              }`}
            >
              <p className="font-medium">{trainer.profiles?.display_name || '名前未設定'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 曜日選択 */}
      <div className="space-y-2">
        <Label>曜日（複数選択可）</Label>
        <div className="flex flex-wrap gap-2">
          {DAY_LABELS.map((label, index) => (
            <button
              key={index}
              type="button"
              onClick={() => toggleDay(index)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                selectedDays.includes(index)
                  ? 'border-amber-500 bg-amber-500 text-white'
                  : 'hover:border-gray-300'
              } ${index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 時間選択 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>開始時間</Label>
          <select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full h-10 px-3 border rounded-md"
          >
            {TIME_OPTIONS.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>終了時間</Label>
          <select
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full h-10 px-3 border rounded-md"
          >
            {TIME_OPTIONS.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 確認表示 */}
      {selectedDays.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            登録内容: {selectedDays.map(d => DAY_LABELS[d]).join('・')} {startTime}〜{endTime}
          </p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading || !trainerId || selectedDays.length === 0}>
        {loading ? '登録中...' : 'シフトを登録する'}
      </Button>
    </form>
  )
}
