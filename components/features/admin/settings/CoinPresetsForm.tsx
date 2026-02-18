'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Save, Plus, Trash2, GripVertical, Coins } from 'lucide-react'

export interface CoinPreset {
  id: string
  label: string
  amount: number
}

interface Props {
  initialPresets: CoinPreset[]
}

export default function CoinPresetsForm({ initialPresets }: Props) {
  const [presets, setPresets] = useState<CoinPreset[]>(initialPresets)
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const addPreset = () => {
    const newPreset: CoinPreset = {
      id: Date.now().toString(),
      label: '',
      amount: 0,
    }
    setPresets([...presets, newPreset])
    setHasChanges(true)
  }

  const removePreset = (id: string) => {
    setPresets(presets.filter(p => p.id !== id))
    setHasChanges(true)
  }

  const updatePreset = (id: string, field: 'label' | 'amount', value: string) => {
    setPresets(presets.map(p =>
      p.id === id
        ? { ...p, [field]: field === 'amount' ? parseInt(value) || 0 : value }
        : p
    ))
    setHasChanges(true)
  }

  const handleSave = async () => {
    // バリデーション
    const valid = presets.every(p => p.label.trim() && p.amount > 0)
    if (!valid) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: '全ての項目に名前と金額を入力してください',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [{
            key: 'coin_grant_presets',
            value: JSON.stringify(presets.map(p => ({
              id: p.id,
              label: p.label.trim(),
              amount: p.amount,
            }))),
          }],
        }),
      })

      if (!response.ok) {
        throw new Error('保存に失敗しました')
      }

      toast({ title: '保存完了', description: 'コイン付与プリセットを保存しました' })
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
            <Coins className="h-5 w-5" />
            コイン付与プリセット
          </CardTitle>
          <CardDescription>
            コイン付与時に選べるプリセット金額を管理します。ユーザー詳細や一括付与で表示されます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {presets.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">プリセットがありません</p>
          ) : (
            <div className="space-y-3">
              {/* ヘッダー */}
              <div className="grid grid-cols-[1fr_1fr_auto] gap-3 px-2">
                <Label className="text-xs text-muted-foreground">プラン名</Label>
                <Label className="text-xs text-muted-foreground">付与SC</Label>
                <div className="w-9" />
              </div>

              {presets.map((preset, index) => (
                <div
                  key={preset.id}
                  className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center p-3 border rounded-lg bg-card"
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    <Input
                      placeholder="例: ライト"
                      value={preset.label}
                      onChange={(e) => updatePreset(preset.id, 'label', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="19000"
                      value={preset.amount || ''}
                      onChange={(e) => updatePreset(preset.id, 'amount', e.target.value)}
                      min="1"
                    />
                    <span className="text-sm text-muted-foreground shrink-0">SC</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePreset(preset.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={addPreset}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            プリセットを追加
          </Button>
        </CardContent>
      </Card>

      {/* プレビュー */}
      {presets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">プレビュー</CardTitle>
            <CardDescription>コイン付与画面で以下のように表示されます</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {presets.filter(p => p.label && p.amount > 0).map(preset => (
                <div
                  key={preset.id}
                  className="px-4 py-2 border rounded-lg text-sm"
                >
                  {preset.label} ({preset.amount.toLocaleString()})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading || !hasChanges}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? '保存中...' : 'プリセットを保存'}
        </Button>
      </div>
    </div>
  )
}
