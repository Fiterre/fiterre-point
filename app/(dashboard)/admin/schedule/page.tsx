'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Plus, Trash2, CalendarOff, Clock, Shield } from 'lucide-react'

interface Block {
  id: string
  reserved_at: string
  is_all_day_block: boolean
  block_reason: string | null
  mentor_id: string | null
  mentors: {
    profiles: {
      display_name: string | null
    }
  } | null
}

export default function AdminSchedulePage() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const { toast } = useToast()

  // フォーム
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [isAllDay, setIsAllDay] = useState(false)
  const [blockReason, setBlockReason] = useState('')

  const fetchBlocks = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/reservations/block')
      const data = await response.json()
      if (response.ok) {
        setBlocks(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch blocks:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBlocks()
  }, [fetchBlocks])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!startDate) {
      toast({ variant: 'destructive', title: 'エラー', description: '日付は必須です' })
      return
    }

    setCreating(true)

    try {
      const startAt = isAllDay
        ? `${startDate}T00:00:00`
        : `${startDate}T${startTime}:00`

      const response = await fetch('/api/admin/reservations/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_at: startAt,
          is_all_day_block: isAllDay,
          block_reason: blockReason.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '作成に失敗しました')
      }

      toast({ title: '作成完了', description: 'ブロックを作成しました' })
      setShowForm(false)
      setStartDate('')
      setStartTime('09:00')
      setIsAllDay(false)
      setBlockReason('')
      fetchBlocks()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: error instanceof Error ? error.message : 'エラーが発生しました',
      })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このブロックを削除しますか？')) return

    try {
      const response = await fetch(`/api/admin/reservations/block/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '削除に失敗しました')
      }

      toast({ title: '削除完了', description: 'ブロックを削除しました' })
      fetchBlocks()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: error instanceof Error ? error.message : 'エラーが発生しました',
      })
    }
  }

  const formatDateTime = (dateStr: string, isAllDay: boolean) => {
    const date = new Date(dateStr)
    const dateFormatted = date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })
    if (isAllDay) return `${dateFormatted}（終日）`
    const timeFormatted = date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    })
    return `${dateFormatted} ${timeFormatted}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">スケジュール管理</h1>
          <p className="text-muted-foreground">予約ブロック（休業日・メンテナンス等）の管理</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          ブロックを作成
        </Button>
      </div>

      {/* ブロック作成フォーム */}
      {showForm && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">新しいブロック</CardTitle>
            <CardDescription>
              ブロックされた枠は顧客には「予約済み」として表示されます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">日付 <span className="text-red-500">*</span></Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                {!isAllDay && (
                  <div className="space-y-2">
                    <Label htmlFor="startTime">時間</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="isAllDay"
                  checked={isAllDay}
                  onCheckedChange={setIsAllDay}
                />
                <Label htmlFor="isAllDay">一日丸ごとブロック</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="blockReason">ブロック理由（管理者のみ表示）</Label>
                <Input
                  id="blockReason"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="休業日、メンテナンス等"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  キャンセル
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? '作成中...' : 'ブロックを作成'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ブロック一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            ブロック一覧
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">読み込み中...</p>
          ) : blocks.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              ブロックはありません
            </p>
          ) : (
            <div className="space-y-3">
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-white"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      {block.is_all_day_block ? (
                        <CalendarOff className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {formatDateTime(block.reserved_at, block.is_all_day_block)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {block.is_all_day_block && (
                          <Badge variant="outline" className="text-red-600 border-red-300">
                            終日
                          </Badge>
                        )}
                        {block.mentor_id && (
                          <Badge variant="outline">
                            {block.mentors?.profiles?.display_name || 'メンター指定'}
                          </Badge>
                        )}
                        {block.block_reason && (
                          <span className="text-sm text-muted-foreground">
                            {block.block_reason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(block.id)}
                  >
                    <Trash2 className="h-4 w-4" />
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
