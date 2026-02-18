'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2, GripVertical, FlaskConical } from 'lucide-react'
import { FitestItem, FitestInputType, FitestScoringMethod, INPUT_TYPE_LABELS, SCORING_METHOD_LABELS } from '@/types/database'

interface Props {
  initialItems: FitestItem[]
}

const EMPTY_FORM = {
  name: '',
  description: '',
  icon: '',
  input_type: 'score' as FitestInputType,
  unit: '',
  scoring_method: 'higher_better' as FitestScoringMethod,
  max_score: 100,
  display_order: 0,
}

export default function FitestItemsTab({ initialItems }: Props) {
  const [items, setItems] = useState<FitestItem[]>(initialItems)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, display_order: items.length + 1 })
    setShowForm(true)
  }

  const openEdit = (item: FitestItem) => {
    setEditingId(item.id)
    setForm({
      name: item.name,
      description: item.description ?? '',
      icon: item.icon ?? '',
      input_type: item.input_type,
      unit: item.unit ?? '',
      scoring_method: item.scoring_method,
      max_score: item.max_score,
      display_order: item.display_order,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ variant: 'destructive', title: '項目名を入力してください' })
      return
    }
    setLoading(true)
    try {
      const body = { ...form, description: form.description || null, icon: form.icon || null, unit: form.unit || null }
      const url = editingId ? `/api/admin/fitest-items/${editingId}` : '/api/admin/fitest-items'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error((await res.json()).error)

      toast({ title: editingId ? '更新しました' : '追加しました' })
      setShowForm(false)
      router.refresh()

      // ローカルステートも即時更新
      const saved: FitestItem = await res.clone().json()
      setItems(prev => editingId
        ? prev.map(i => i.id === editingId ? saved : i)
        : [...prev, saved]
      )
    } catch (e) {
      toast({ variant: 'destructive', title: 'エラー', description: e instanceof Error ? e.message : '失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (item: FitestItem) => {
    const res = await fetch(`/api/admin/fitest-items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !item.is_active }),
    })
    if (res.ok) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この項目を無効化しますか？')) return
    const res = await fetch(`/api/admin/fitest-items/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: false } : i))
      toast({ title: '無効化しました' })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Fitestテスト項目
              </CardTitle>
              <CardDescription>
                テスト項目の追加・編集・並び順を管理します
              </CardDescription>
            </div>
            <Button onClick={openCreate} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              項目を追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {items.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">項目がありません</p>
            )}
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 border rounded-lg ${
                  item.is_active ? 'bg-card' : 'bg-muted opacity-60'
                }`}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {INPUT_TYPE_LABELS[item.input_type]}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {SCORING_METHOD_LABELS[item.scoring_method]}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={() => handleToggleActive(item)}
                    title={item.is_active ? '無効化' : '有効化'}
                  />
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 追加・編集フォーム */}
      {showForm && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-base">
              {editingId ? 'テスト項目を編集' : '新規テスト項目'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>項目名 *</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="例: 神経衰弱"
                />
              </div>
              <div className="space-y-1">
                <Label>単位</Label>
                <Input
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  placeholder="例: 点 / kg / 秒"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>説明</Label>
              <Input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="テストの内容を簡単に説明"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>入力タイプ *</Label>
                <select
                  value={form.input_type}
                  onChange={e => setForm(f => ({ ...f, input_type: e.target.value as FitestInputType }))}
                  className="w-full h-10 px-3 border rounded-md bg-background"
                >
                  {(Object.entries(INPUT_TYPE_LABELS) as [FitestInputType, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label>採点方式 *</Label>
                <select
                  value={form.scoring_method}
                  onChange={e => setForm(f => ({ ...f, scoring_method: e.target.value as FitestScoringMethod }))}
                  className="w-full h-10 px-3 border rounded-md bg-background"
                >
                  {(Object.entries(SCORING_METHOD_LABELS) as [FitestScoringMethod, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label>最大スコア (点換算上限)</Label>
                <Input
                  type="number"
                  value={form.max_score}
                  onChange={e => setForm(f => ({ ...f, max_score: Number(e.target.value) }))}
                  min={1}
                  max={1000}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>表示順</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))}
                  min={0}
                />
              </div>
              <div className="space-y-1">
                <Label>アイコン (lucide-react 名)</Label>
                <Input
                  value={form.icon}
                  onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                  placeholder="例: Brain / Dumbbell"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={loading}>
                {loading ? '保存中...' : (editingId ? '更新' : '追加')}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
