'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface Mentor {
  id: string
  profiles: { display_name: string | null }
}

interface SessionType {
  id: string
  name: string
  duration_minutes: number
  coin_cost: number
}

interface User {
  id: string
  email: string
  display_name: string | null
}

interface Props {
  mentors: Mentor[]
  sessionTypes: SessionType[]
  users: User[]
}

const DAY_LABELS = ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜']
const TIME_OPTIONS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
]

export default function RecurringReservationForm({ mentors, sessionTypes, users }: Props) {
  const [userId, setUserId] = useState('')
  const [mentorId, setMentorId] = useState('')
  const [sessionTypeId, setSessionTypeId] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(null)
  const [startTime, setStartTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  const selectedSession = sessionTypes.find(s => s.id === sessionTypeId)

  // 終了時間を計算
  const endTime = startTime && selectedSession
    ? (() => {
        const [h, m] = startTime.split(':').map(Number)
        const end = new Date(2000, 0, 1, h, m + selectedSession.duration_minutes)
        return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
      })()
    : ''

  // ユーザー検索フィルター
  const filteredUsers = users.filter(user =>
    searchQuery === '' ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId || !mentorId || !sessionTypeId || dayOfWeek === null || !startTime) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: '全ての項目を入力してください',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          mentorId,
          sessionTypeId,
          dayOfWeek,
          startTime,
          endTime,
          notes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '登録に失敗しました')
      }

      toast({
        title: '登録完了',
        description: '固定予約を登録しました',
      })

      router.push('/admin/recurring')
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
      {/* 顧客選択 */}
      <div className="space-y-2">
        <Label>顧客</Label>
        <Input
          placeholder="名前またはメールで検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-2"
        />
        <div className="max-h-48 overflow-y-auto border rounded-lg">
          {filteredUsers.slice(0, 20).map(user => (
            <div
              key={user.id}
              onClick={() => setUserId(user.id)}
              className={`p-3 cursor-pointer border-b last:border-0 ${
                userId === user.id ? 'bg-amber-50' : 'hover:bg-gray-50'
              }`}
            >
              <p className="font-medium">{user.display_name || '名前未設定'}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          ))}
        </div>
      </div>

      {/* セッション種別 */}
      <div className="space-y-2">
        <Label>セッション種別</Label>
        <div className="grid grid-cols-1 gap-2">
          {sessionTypes.map(session => (
            <div
              key={session.id}
              onClick={() => setSessionTypeId(session.id)}
              className={`p-3 border rounded-lg cursor-pointer ${
                sessionTypeId === session.id ? 'border-amber-500 bg-amber-50' : 'hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between">
                <span>{session.name}（{session.duration_minutes}分）</span>
                <span className="font-bold text-amber-600">{session.coin_cost.toLocaleString()} SC</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* メンター */}
      <div className="space-y-2">
        <Label>担当メンター</Label>
        <div className="grid grid-cols-2 gap-2">
          {mentors.map(mentor => (
            <div
              key={mentor.id}
              onClick={() => setMentorId(mentor.id)}
              className={`p-3 border rounded-lg cursor-pointer ${
                mentorId === mentor.id ? 'border-amber-500 bg-amber-50' : 'hover:border-gray-300'
              }`}
            >
              {mentor.profiles?.display_name || '名前未設定'}
            </div>
          ))}
        </div>
      </div>

      {/* 曜日 */}
      <div className="space-y-2">
        <Label>曜日</Label>
        <div className="flex flex-wrap gap-2">
          {DAY_LABELS.map((label, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setDayOfWeek(index)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                dayOfWeek === index
                  ? 'border-amber-500 bg-amber-500 text-white'
                  : 'hover:border-gray-300'
              } ${index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 時間 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>開始時間</Label>
          <select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full h-10 px-3 border rounded-md"
            required
          >
            <option value="">選択</option>
            {TIME_OPTIONS.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>終了時間</Label>
          <Input value={endTime} disabled className="bg-gray-50" />
        </div>
      </div>

      {/* メモ */}
      <div className="space-y-2">
        <Label>メモ（任意）</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="特記事項など"
        />
      </div>

      {/* 確認 */}
      {userId && dayOfWeek !== null && startTime && selectedSession && (
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="font-medium text-amber-800">登録内容</p>
          <p className="text-sm text-amber-700 mt-1">
            毎週{DAY_LABELS[dayOfWeek]} {startTime}〜{endTime} / {selectedSession.name}
          </p>
          <p className="text-sm text-amber-700">
            毎月28日に翌月分の予約を自動作成します
          </p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? '登録中...' : '固定予約を登録する'}
      </Button>
    </form>
  )
}
