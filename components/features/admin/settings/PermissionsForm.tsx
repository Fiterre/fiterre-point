'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Save, Shield, ChevronDown, ChevronRight } from 'lucide-react'
import TierBadge from '@/components/features/auth/TierBadge'

interface TierPermissions {
  users: { view: boolean; edit: boolean; delete: boolean }
  coins: { view: boolean; grant: boolean; adjust: boolean }
  mentors: { view: boolean; edit: boolean; manage_all: boolean }
  shifts: { view: boolean; edit_own: boolean; edit_all: boolean }
  reservations: { view_all?: boolean; view_own?: boolean; edit_all?: boolean; edit_own?: boolean; cancel: boolean }
  recurring: { view: boolean; edit: boolean; execute: boolean }
  fitest: { view: boolean; input: boolean; manage: boolean }
  records: { view_all?: boolean; view_own?: boolean; edit_all?: boolean; edit_own?: boolean }
  settings: { view: boolean; edit: boolean }
  analytics: { view: boolean }
}

interface Tier {
  id: string
  tier_level: number
  tier_name: string
  description: string | null
  permissions: TierPermissions
}

interface Props {
  initialTiers: Tier[]
}

const CATEGORY_LABELS: Record<string, string> = {
  users: 'ユーザー管理',
  coins: 'コイン管理',
  mentors: 'メンター管理',
  shifts: 'シフト管理',
  reservations: '予約管理',
  recurring: '固定予約',
  fitest: 'Fitest',
  records: 'トレーニング記録',
  settings: '設定',
  analytics: '分析',
}

const ACTION_LABELS: Record<string, string> = {
  view: '閲覧',
  view_all: '全体閲覧',
  view_own: '自分のみ閲覧',
  edit: '編集',
  edit_all: '全体編集',
  edit_own: '自分のみ編集',
  delete: '削除',
  grant: '付与',
  adjust: '調整',
  manage_all: '全体管理',
  cancel: 'キャンセル',
  execute: '実行',
  input: '入力',
  manage: '管理',
}

export default function PermissionsForm({ initialTiers }: Props) {
  const [tiers, setTiers] = useState(initialTiers)
  const [expandedTier, setExpandedTier] = useState<string | null>(initialTiers[0]?.id || null)
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handlePermissionChange = (tierId: string, category: string, action: string, value: boolean) => {
    setTiers(prev => prev.map(tier => {
      if (tier.id !== tierId) return tier
      return {
        ...tier,
        permissions: {
          ...tier.permissions,
          [category]: {
            ...tier.permissions[category as keyof TierPermissions],
            [action]: value
          }
        }
      }
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/admin/settings/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiers }),
      })

      if (!response.ok) {
        throw new Error('保存に失敗しました')
      }

      toast({ title: '保存完了', description: '権限設定を保存しました' })
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
            <Shield className="h-5 w-5" />
            権限Tier設定
          </CardTitle>
          <CardDescription>
            各Tierが持つ権限を設定します。Tier 1が最高権限です。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tiers.map(tier => (
            <div key={tier.id} className="border rounded-lg">
              {/* Tierヘッダー */}
              <button
                onClick={() => setExpandedTier(expandedTier === tier.id ? null : tier.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  {expandedTier === tier.id ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground/70" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground/70" />
                  )}
                  <TierBadge tierLevel={tier.tier_level} tierName={tier.tier_name} />
                  <span className="text-sm text-muted-foreground">{tier.description}</span>
                </div>
              </button>

              {/* 権限詳細 */}
              {expandedTier === tier.id && (
                <div className="border-t p-4 bg-muted">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(tier.permissions).map(([category, actions]) => (
                      <div key={category} className="bg-white p-3 rounded-lg border">
                        <h4 className="font-medium text-sm mb-2">
                          {CATEGORY_LABELS[category] || category}
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(actions as Record<string, boolean>).map(([action, enabled]) => (
                            <div key={action} className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                {ACTION_LABELS[action] || action}
                              </span>
                              <Switch
                                checked={enabled}
                                onCheckedChange={(value) =>
                                  handlePermissionChange(tier.id, category, action, value)
                                }
                                disabled={tier.tier_level === 1}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {tier.tier_level === 1 && (
                    <p className="text-xs text-muted-foreground mt-3">
                      ※ Tier 1（Admin）の権限は変更できません
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={loading || !hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? '保存中...' : '権限設定を保存'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 権限の説明 */}
      <Card>
        <CardHeader>
          <CardTitle>権限カテゴリの説明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium">ユーザー管理</h4>
              <p className="text-muted-foreground">顧客情報の閲覧・編集・削除</p>
            </div>
            <div>
              <h4 className="font-medium">コイン管理</h4>
              <p className="text-muted-foreground">コイン残高の確認・付与・調整</p>
            </div>
            <div>
              <h4 className="font-medium">シフト管理</h4>
              <p className="text-muted-foreground">自分/全員のシフト編集</p>
            </div>
            <div>
              <h4 className="font-medium">予約管理</h4>
              <p className="text-muted-foreground">予約の閲覧・編集・キャンセル</p>
            </div>
            <div>
              <h4 className="font-medium">Fitest</h4>
              <p className="text-muted-foreground">テストの閲覧・入力・設定管理</p>
            </div>
            <div>
              <h4 className="font-medium">トレーニング記録</h4>
              <p className="text-muted-foreground">記録の閲覧・編集権限</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
