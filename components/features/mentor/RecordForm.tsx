'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Plus, Trash2, Save, Loader2 } from 'lucide-react'

interface User {
  id: string
  email: string
  display_name: string | null
}

interface Exercise {
  name: string
  sets?: number
  reps?: number
  weight?: number
  duration?: number
  notes?: string
}

interface Props {
  mentorId: string
  users: User[]
  recordType: 'daily' | 'monthly'
  preselectedUserId?: string
}

export default function RecordForm({ mentorId, users, recordType, preselectedUserId }: Props) {
  const [selectedUserId, setSelectedUserId] = useState(preselectedUserId || '')
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const addExercise = () => {
    setExercises([...exercises, { name: '' }])
  }

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const updated = [...exercises]
    updated[index] = { ...updated[index], [field]: value }
    setExercises(updated)
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUserId) {
      toast({ variant: 'destructive', title: 'エラー', description: '顧客を選択してください' })
      return
    }

    if (!content.trim()) {
      toast({ variant: 'destructive', title: 'エラー', description: '内容を入力してください' })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/mentor/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          recordDate,
          recordType,
          title: title || null,
          content,
          exercises: exercises.filter(e => e.name.trim()),
          notes: notes || null
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '保存に失敗しました')
      }

      toast({ title: '保存完了', description: '記録を保存しました' })
      router.push('/mentor/records')
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

  const isMonthly = recordType === 'monthly'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 顧客選択 */}
          <div className="space-y-2">
            <Label htmlFor="user">顧客 *</Label>
            <select
              id="user"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full h-10 px-3 border rounded-md"
              required
            >
              <option value="">選択してください</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.display_name || user.email}
                </option>
              ))}
            </select>
          </div>

          {/* 日付 */}
          <div className="space-y-2">
            <Label htmlFor="date">
              {isMonthly ? '対象月' : '実施日'} *
            </Label>
            <Input
              id="date"
              type={isMonthly ? 'month' : 'date'}
              value={isMonthly ? recordDate.slice(0, 7) : recordDate}
              onChange={(e) => setRecordDate(isMonthly ? `${e.target.value}-01` : e.target.value)}
              required
            />
          </div>

          {/* タイトル */}
          <div className="space-y-2">
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isMonthly ? '例: 2月の努力の軌跡' : '例: 上半身トレーニング'}
            />
          </div>
        </CardContent>
      </Card>

      {/* 内容 */}
      <Card className={isMonthly ? 'border-amber-200 bg-amber-50/30' : ''}>
        <CardHeader>
          <CardTitle>{isMonthly ? '月次レポート内容' : 'トレーニング内容'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isMonthly
              ? '今月の成長、達成したこと、来月への目標などをまとめてください...'
              : '今日のトレーニング内容を記録してください...'
            }
            rows={isMonthly ? 12 : 6}
            required
          />
        </CardContent>
      </Card>

      {/* エクササイズ（日次のみ） */}
      {!isMonthly && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>実施種目</span>
              <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                <Plus className="h-4 w-4 mr-1" />
                追加
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {exercises.length === 0 ? (
              <p className="text-center py-4 text-gray-500">
                種目を追加してください
              </p>
            ) : (
              <div className="space-y-4">
                {exercises.map((exercise, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2">
                      <Input
                        placeholder="種目名 *"
                        value={exercise.name}
                        onChange={(e) => updateExercise(index, 'name', e.target.value)}
                        className="col-span-2 md:col-span-1"
                      />
                      <Input
                        type="number"
                        placeholder="セット"
                        value={exercise.sets || ''}
                        onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 0)}
                      />
                      <Input
                        type="number"
                        placeholder="レップ"
                        value={exercise.reps || ''}
                        onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value) || 0)}
                      />
                      <Input
                        type="number"
                        placeholder="重量(kg)"
                        value={exercise.weight || ''}
                        onChange={(e) => updateExercise(index, 'weight', parseFloat(e.target.value) || 0)}
                      />
                      <Input
                        type="number"
                        placeholder="時間(分)"
                        value={exercise.duration || ''}
                        onChange={(e) => updateExercise(index, 'duration', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExercise(index)}
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* メモ */}
      <Card>
        <CardHeader>
          <CardTitle>メモ・備考</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="その他のメモや次回への引き継ぎ事項など..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* 送信 */}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            保存中...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            記録を保存
          </>
        )}
      </Button>
    </form>
  )
}
