'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface SessionType {
  id: string
  name: string
  duration_minutes: number
  coin_cost: number
  description: string | null
}

interface Mentor {
  id: string
  name: string
  profiles: {
    display_name: string | null
  }
}

interface Props {
  sessionTypes: SessionType[]
  availableBalance: number
}

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

export default function ReservationForm({ sessionTypes, availableBalance }: Props) {
  const [sessionTypeId, setSessionTypeId] = useState('')
  const [mentorId, setMentorId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMentors, setLoadingMentors] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [availableMentors, setAvailableMentors] = useState<Mentor[]>([])
  const [selectedDayLabel, setSelectedDayLabel] = useState('')
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [closedReason, setClosedReason] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const selectedSession = sessionTypes.find(s => s.id === sessionTypeId)
  const canAfford = selectedSession ? availableBalance >= selectedSession.coin_cost : true

  // 明日以降の日付のみ選択可能
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  // 28日ルール: 毎月28日に翌月分を解放
  const now = new Date()
  const maxDate = now.getDate() >= 28
    ? new Date(now.getFullYear(), now.getMonth() + 2, 0) // 翌月末
    : new Date(now.getFullYear(), now.getMonth() + 1, 0) // 今月末
  const maxDateStr = maxDate.toISOString().split('T')[0]

  // 日付変更時: 時間枠を再取得
  useEffect(() => {
    if (!date) {
      setTimeSlots([])
      setClosedReason(null)
      setTime('')
      setAvailableMentors([])
      setMentorId('')
      return
    }
    fetchTimeSlots()
  }, [date])

  // 日付または時間が変更されたらメンターを再取得
  useEffect(() => {
    if (date && time) {
      fetchAvailableMentors()
    } else {
      setAvailableMentors([])
      setMentorId('')
    }
  }, [date, time])

  const fetchTimeSlots = async () => {
    setLoadingSlots(true)
    setTime('')
    setClosedReason(null)
    setAvailableMentors([])
    setMentorId('')

    try {
      const response = await fetch(`/api/available-slots?date=${date}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      if (data.slots.length === 0) {
        const reasonMap: Record<string, string> = {
          regular_holiday: '定休日',
          closed_holiday: '臨時休業',
          blocked: 'ブロック',
          invalid_hours: '営業時間設定エラー',
        }
        setClosedReason(reasonMap[data.reason] ?? '休業')
        setTimeSlots([])
      } else {
        setTimeSlots(data.slots)
        setClosedReason(null)
      }
    } catch {
      setTimeSlots([])
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: '時間枠の取得に失敗しました',
      })
    } finally {
      setLoadingSlots(false)
    }
  }

  const fetchAvailableMentors = async () => {
    setLoadingMentors(true)
    setMentorId('')  // メンター選択をリセット

    try {
      const response = await fetch(`/api/mentors/available?date=${date}&time=${time}`)
      const data = await response.json()

      if (response.ok) {
        setAvailableMentors(data.mentors)
        setSelectedDayLabel(DAY_LABELS[data.dayOfWeek])
      } else {
        setAvailableMentors([])
      }
    } catch (error) {
      console.error('Error fetching mentors:', error)
      setAvailableMentors([])
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: 'メンター取得に失敗しました',
      })
    } finally {
      setLoadingMentors(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canAfford) {
      toast({
        variant: 'destructive',
        title: 'コイン不足',
        description: 'コインが足りません',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionTypeId,
          mentorId,
          date,
          startTime: time,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '予約に失敗しました')
      }

      toast({
        title: '予約完了',
        description: '予約が作成されました',
      })

      router.push('/dashboard/reservations')
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: error instanceof Error ? error.message : '予約に失敗しました',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* セッション種別 */}
      <div className="space-y-3">
        <Label>セッション種別</Label>
        <div className="grid grid-cols-1 gap-3">
          {sessionTypes.map((session) => (
            <div
              key={session.id}
              onClick={() => setSessionTypeId(session.id)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                sessionTypeId === session.id
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{session.name}</p>
                  <p className="text-sm text-muted-foreground">{session.description}</p>
                  <p className="text-sm text-muted-foreground">{session.duration_minutes}分</p>
                </div>
                <p className="font-bold text-primary">
                  {session.coin_cost.toLocaleString()} SC
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 日付・時間（メンターより先に選択） */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">日付</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={minDate}
            max={maxDateStr}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">開始時間</Label>
          {loadingSlots ? (
            <div className="flex items-center h-10 px-3 border rounded-md text-sm text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              読み込み中...
            </div>
          ) : closedReason ? (
            <div className="flex items-center h-10 px-3 border rounded-md text-sm text-red-600 bg-red-50">
              {closedReason}のため予約不可
            </div>
          ) : (
            <select
              id="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full h-10 px-3 border rounded-md bg-background"
              required
              disabled={timeSlots.length === 0}
            >
              <option value="">{date ? '選択してください' : '日付を先に選択'}</option>
              {timeSlots.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* メンター（日時選択後に表示） */}
      <div className="space-y-3">
        <Label>
          メンター
          {selectedDayLabel && (
            <span className="ml-2 text-sm text-muted-foreground">
              （{selectedDayLabel}曜 {time} に対応可能）
            </span>
          )}
        </Label>

        {!date || !time ? (
          <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
            日付と時間を選択すると、対応可能なメンターが表示されます
          </p>
        ) : loadingMentors ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">メンターを検索中...</span>
          </div>
        ) : availableMentors.length === 0 ? (
          <div className="p-4 bg-red-50 rounded-lg text-red-600 text-sm">
            この日時に対応可能なメンターがいません。別の日時を選択してください。
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableMentors.map((mentor) => (
              <div
                key={mentor.id}
                onClick={() => setMentorId(mentor.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  mentorId === mentor.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-gray-300'
                }`}
              >
                <p className="font-medium">{mentor.profiles?.display_name || mentor.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 確認・送信 */}
      {selectedSession && (
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex justify-between items-center">
            <span>消費コイン</span>
            <span className={`font-bold ${canAfford ? 'text-primary' : 'text-red-600'}`}>
              {selectedSession.coin_cost.toLocaleString()} SC
            </span>
          </div>
          {!canAfford && (
            <p className="text-red-600 text-sm mt-2">
              コインが不足しています（あと{(selectedSession.coin_cost - availableBalance).toLocaleString()} SC必要）
            </p>
          )}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !sessionTypeId || !mentorId || !date || !time || !canAfford}
      >
        {loading ? '予約中...' : '予約する'}
      </Button>
    </form>
  )
}
