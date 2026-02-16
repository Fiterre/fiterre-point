'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Save, Sun, Moon, Monitor, Palette } from 'lucide-react'

interface Props {
  initialTheme: string
  initialAccentColor: string
  initialAppName: string
  initialLogoUrl: string
  initialFontSize: string
}

const THEME_OPTIONS = [
  { value: 'light', label: 'ライト', icon: Sun },
  { value: 'dark', label: 'ダーク', icon: Moon },
  { value: 'system', label: 'システム', icon: Monitor },
]

const COLOR_OPTIONS = [
  { value: 'amber', label: 'アンバー', class: 'bg-amber-500' },
  { value: 'blue', label: 'ブルー', class: 'bg-blue-500' },
  { value: 'green', label: 'グリーン', class: 'bg-green-500' },
  { value: 'purple', label: 'パープル', class: 'bg-purple-500' },
  { value: 'red', label: 'レッド', class: 'bg-red-500' },
  { value: 'emerald', label: 'エメラルド', class: 'bg-emerald-500' },
]

const FONT_OPTIONS = [
  { value: 'compact', label: 'コンパクト', description: '情報を多く表示' },
  { value: 'normal', label: '標準', description: 'バランスの取れた表示' },
  { value: 'large', label: '大きめ', description: '読みやすい大きな文字' },
]

export default function AppearanceForm({
  initialTheme,
  initialAccentColor,
  initialAppName,
  initialLogoUrl,
  initialFontSize,
}: Props) {
  const [theme, setTheme] = useState(initialTheme)
  const [accentColor, setAccentColor] = useState(initialAccentColor)
  const [appName, setAppName] = useState(initialAppName)
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl)
  const [fontSize, setFontSize] = useState(initialFontSize)
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleChange = (setter: (v: string) => void) => (value: string) => {
    setter(value)
    setHasChanges(true)
  }

  const handleSave = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [
            { key: 'theme_mode', value: theme },
            { key: 'accent_color', value: accentColor },
            { key: 'app_name', value: appName },
            { key: 'logo_url', value: logoUrl },
            { key: 'font_size', value: fontSize },
          ]
        }),
      })

      if (!response.ok) {
        throw new Error('保存に失敗しました')
      }

      toast({ title: '保存完了', description: 'デザイン設定を保存しました' })
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
      {/* テーマ設定 */}
      <Card>
        <CardHeader>
          <CardTitle>テーマ設定</CardTitle>
          <CardDescription>アプリの見た目をカスタマイズします</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* カラーテーマ */}
          <div className="space-y-3">
            <Label>カラーテーマ</Label>
            <div className="grid grid-cols-3 gap-3">
              {THEME_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleChange(setTheme)(opt.value)}
                  className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-colors ${
                    theme === opt.value
                      ? 'border-amber-500 bg-amber-50'
                      : 'hover:border-gray-300'
                  }`}
                >
                  <opt.icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* アクセントカラー */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              アクセントカラー
            </Label>
            <div className="flex flex-wrap gap-3">
              {COLOR_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleChange(setAccentColor)(opt.value)}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                    accentColor === opt.value
                      ? 'border-gray-900 ring-2 ring-gray-900'
                      : 'hover:border-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full ${opt.class}`} />
                  <span className="text-sm">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* フォントサイズ */}
          <div className="space-y-3">
            <Label>フォントサイズ</Label>
            <div className="grid grid-cols-3 gap-3">
              {FONT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleChange(setFontSize)(opt.value)}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    fontSize === opt.value
                      ? 'border-amber-500 bg-amber-50'
                      : 'hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium block">{opt.label}</span>
                  <span className="text-xs text-gray-500">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ブランディング */}
      <Card>
        <CardHeader>
          <CardTitle>ブランディング</CardTitle>
          <CardDescription>アプリ名やロゴを設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="appName">アプリ名</Label>
            <Input
              id="appName"
              value={appName}
              onChange={(e) => handleChange(setAppName)(e.target.value)}
              placeholder="Stella Coin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">ロゴURL</Label>
            <Input
              id="logoUrl"
              value={logoUrl}
              onChange={(e) => handleChange(setLogoUrl)(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-gray-500">
              ※ 画像ファイルのURLを入力してください（推奨サイズ: 200x50px）
            </p>
          </div>

          {logoUrl && (
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">プレビュー:</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Logo preview"
                className="h-12 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading || !hasChanges}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? '保存中...' : 'デザイン設定を保存'}
        </Button>
      </div>

      {/* プレビュー */}
      <Card>
        <CardHeader>
          <CardTitle>プレビュー</CardTitle>
          <CardDescription>現在の設定でのボタン・カラーの見え方</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className={`px-4 py-2 rounded-lg text-white bg-${accentColor}-500`}>
              プライマリボタン
            </div>
            <div className={`px-4 py-2 rounded-lg border border-${accentColor}-500 text-${accentColor}-600`}>
              セカンダリボタン
            </div>
            <div className={`px-4 py-2 rounded-lg bg-${accentColor}-100 text-${accentColor}-800`}>
              バッジ
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            ※ 実際の反映にはページの再読み込みが必要な場合があります
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
