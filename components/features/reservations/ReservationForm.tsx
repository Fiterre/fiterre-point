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
  specialty: string | null
  profiles: {
    display_name: string | null
  }
}

interface Props {
  sessionTypes: SessionType[]
  mentors: Mentor[]  // 初期表示用（全メンター）
  availableBalance: number
}

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

export default function ReservationForm({ sessionTypes, mentors: allMentors, availableBalance }: Props) {
  const [sessionTypeId, setSessionTypeId] = useState('')
  const [mentorId, setMentorId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMentors, setLoadingMentors] = useState(false)
  const [availableMentors, setAvailableMentors] = useState<Mentor[]>([])
  const [selectedDayLabel, setSelectedDayLabel] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  const selectedSession = sessionTypes.find(s => s.id === sessionTypeId)
  const canAfford = selectedSession ? availableBalance >= selectedSession.coin_cost : true

  // 明日以降の日付のみ選択可能
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  // 2週間後まで
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 14)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  // 日付または時間が変更されたらメンターを再取得
  useEffect(() => {
    if (date && time) {
      fetchAvailableMentors()
    } else {
      setAvailableMentors([])
      setMentorId('')
    }
  }, [date, time])

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
                  ? 'border-amber-500 bg-amber-50'
                  : 'hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{session.name}</p>
                  <p className="text-sm text-gray-500">{session.description}</p>
                  <p className="text-sm text-gray-500">{session.duration_minutes}分</p>
                </div>
                <p className="font-bold text-amber-600">
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
          <select
            id="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full h-10 px-3 border rounded-md"
            required
          >
            <option value="">選択してください</option>
            <option value="09:00">09:00</option>
            <option value="10:00">10:00</option>
            <option value="11:00">11:00</option>
            <option value="12:00">12:00</option>
            <option value="13:00">13:00</option>
            <option value="14:00">14:00</option>
            <option value="15:00">15:00</option>
            <option value="16:00">16:00</option>
            <option value="17:00">17:00</option>
            <option value="18:00">18:00</option>
            <option value="19:00">19:00</option>
            <option value="20:00">20:00</option>
          </select>
        </div>
      </div>

      {/* メンター（日時選択後に表示） */}
      <div className="space-y-3">
        <Label>
          メンター
          {selectedDayLabel && (
            <span className="ml-2 text-sm text-gray-500">
              （{selectedDayLabel}曜 {time} に対応可能）
            </span>
          )}
        </Label>

        {!date || !time ? (
          <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
            日付と時間を選択すると、対応可能なメンターが表示されます
          </p>
        ) : loadingMentors ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
            <span className="ml-2 text-gray-500">メンターを検索中...</span>
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
                    ? 'border-amber-500 bg-amber-50'
                    : 'hover:border-gray-300'
                }`}
              >
                <p className="font-medium">{mentor.profiles?.display_name || '名前未設定'}</p>
                <p className="text-sm text-gray-500">{mentor.specialty || ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 確認・送信 */}
      {selectedSession && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span>消費コイン</span>
            <span className={`font-bold ${canAfford ? 'text-amber-600' : 'text-red-600'}`}>
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
