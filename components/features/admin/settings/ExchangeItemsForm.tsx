'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Save, Plus, Trash2, ArrowLeftRight, Tag, Package } from 'lucide-react'
import type { ExchangeItem, ExchangeItemCategory } from '@/types/database'

interface EditableItem {
  id?: string
  tempId: string
  category: ExchangeItemCategory
  name: string
  coin_cost: number
}

interface Props {
  initialItems: ExchangeItem[]
}

const CATEGORY_LABELS: Record<ExchangeItemCategory, { label: string; icon: typeof Tag }> = {
  discount: { label: '割引', icon: Tag },
  goods: { label: '物品', icon: Package },
}

export default function ExchangeItemsForm({ initialItems }: Props) {
  const [items, setItems] = useState<EditableItem[]>(
    initialItems.map(item => ({
      id: item.id,
      tempId: item.id,
      category: item.category,
      name: item.name,
      coin_cost: item.coin_cost,
    }))
  )
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const addItem = () => {
    setItems([...items, {
      tempId: Date.now().toString(),
      category: 'goods',
      name: '',
      coin_cost: 0,
    }])
    setHasChanges(true)
  }

  const removeItem = (tempId: string) => {
    setItems(items.filter(i => i.tempId !== tempId))
    setHasChanges(true)
  }

  const updateItem = (tempId: string, field: keyof EditableItem, value: string | number) => {
    setItems(items.map(i =>
      i.tempId === tempId ? { ...i, [field]: value } : i
    ))
    setHasChanges(true)
  }

  const handleSave = async () => {
    const valid = items.every(i => i.name.trim() && i.coin_cost > 0)
    if (!valid) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: '全ての項目に名前と必要SCを入力してください',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/exchange-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            ...(i.id ? { id: i.id } : {}),
            category: i.category,
            name: i.name.trim(),
            coin_cost: i.coin_cost,
          })),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '保存に失敗しました')
      }

      toast({ title: '保存完了', description: '交換アイテムを保存しました' })
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            交換アイテム設定
          </CardTitle>
          <CardDescription>
            SCと交換できるグッズや特典割引を管理します。カテゴリ・項目名・必要SCを設定してください。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">交換アイテムがありません</p>
          ) : (
            <div className="space-y-3">
              {/* ヘッダー */}
              <div className="grid grid-cols-[120px_1fr_120px_auto] gap-3 px-2">
                <Label className="text-xs text-muted-foreground">カテゴリ</Label>
                <Label className="text-xs text-muted-foreground">項目名</Label>
                <Label className="text-xs text-muted-foreground">必要SC</Label>
                <div className="w-9" />
              </div>

              {items.map((item) => (
                <div
                  key={item.tempId}
                  className="grid grid-cols-[120px_1fr_120px_auto] gap-3 items-center p-3 border rounded-lg bg-card"
                >
                  <select
                    value={item.category}
                    onChange={(e) => updateItem(item.tempId, 'category', e.target.value as ExchangeItemCategory)}
                    className="h-10 px-3 border rounded-md bg-background text-sm"
                    aria-label="カテゴリ選択"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <Input
                    placeholder="例: プロテインシェイカー"
                    value={item.name}
                    onChange={(e) => updateItem(item.tempId, 'name', e.target.value)}
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      placeholder="5000"
                      value={item.coin_cost || ''}
                      onChange={(e) => updateItem(item.tempId, 'coin_cost', parseInt(e.target.value) || 0)}
                      min="1"
                      max="999999"
                      step="1"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">SC</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.tempId)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button type="button" variant="outline" onClick={addItem} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            アイテムを追加
          </Button>
        </CardContent>
      </Card>

      {/* プレビュー */}
      {items.filter(i => i.name && i.coin_cost > 0).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">プレビュー</CardTitle>
            <CardDescription>交換画面で以下のように表示されます</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.filter(i => i.name && i.coin_cost > 0).map(item => {
                const catInfo = CATEGORY_LABELS[item.category]
                const CatIcon = catInfo.icon
                return (
                  <div key={item.tempId} className="flex items-center gap-3 p-3 border rounded-lg">
                    <CatIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{catInfo.label}</p>
                    </div>
                    <p className="font-bold text-primary shrink-0">
                      {item.coin_cost.toLocaleString()} SC
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading || !hasChanges}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? '保存中...' : 'アイテムを保存'}
        </Button>
      </div>
    </div>
  )
}
