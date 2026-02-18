'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  Save,
  Building,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Instagram,
  FileText,
  Shield
} from 'lucide-react'

interface Props {
  initialSettings: Record<string, string>
}

const FIELDS = [
  { key: 'gym_name', label: 'ジム名', icon: Building, placeholder: 'Fiterre', type: 'text' },
  { key: 'gym_address', label: '住所', icon: MapPin, placeholder: '東京都○○区...', type: 'text' },
  { key: 'gym_phone', label: '電話番号', icon: Phone, placeholder: '03-1234-5678', type: 'tel' },
  { key: 'gym_email', label: 'メールアドレス', icon: Mail, placeholder: 'info@example.com', type: 'email' },
]

const SOCIAL_FIELDS = [
  { key: 'line_official_url', label: 'LINE公式アカウント', icon: MessageCircle, placeholder: 'https://line.me/R/ti/p/...', description: 'LINE公式アカウントへのリンク' },
  { key: 'instagram_url', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/...', description: 'Instagramプロフィールへのリンク' },
]

const LEGAL_FIELDS = [
  { key: 'terms_url', label: '利用規約', icon: FileText, placeholder: 'https://example.com/terms', description: '利用規約ページへのリンク' },
  { key: 'privacy_url', label: 'プライバシーポリシー', icon: Shield, placeholder: 'https://example.com/privacy', description: 'プライバシーポリシーへのリンク' },
]

export default function GymInfoForm({ initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings)
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: Object.entries(settings).map(([key, value]) => ({
            key,
            value
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('保存に失敗しました')
      }

      toast({ title: '保存完了', description: 'ジム情報を保存しました' })
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
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            基本情報
          </CardTitle>
          <CardDescription>ジムの基本的な情報を設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {FIELDS.map(field => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key} className="flex items-center gap-2">
                <field.icon className="h-4 w-4 text-muted-foreground" />
                {field.label}
              </Label>
              <Input
                id={field.key}
                type={field.type}
                value={settings[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* SNS・外部リンク */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            SNS・外部リンク
          </CardTitle>
          <CardDescription>SNSアカウントへのリンクを設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {SOCIAL_FIELDS.map(field => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key} className="flex items-center gap-2">
                <field.icon className="h-4 w-4 text-muted-foreground" />
                {field.label}
              </Label>
              <Input
                id={field.key}
                type="url"
                value={settings[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
              <p className="text-xs text-muted-foreground">{field.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 法的情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            法的情報
          </CardTitle>
          <CardDescription>利用規約等へのリンクを設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {LEGAL_FIELDS.map(field => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key} className="flex items-center gap-2">
                <field.icon className="h-4 w-4 text-muted-foreground" />
                {field.label}
              </Label>
              <Input
                id={field.key}
                type="url"
                value={settings[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
              <p className="text-xs text-muted-foreground">{field.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* プレビュー */}
      <Card>
        <CardHeader>
          <CardTitle>フッター表示プレビュー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <p className="font-bold">{settings.gym_name || 'ジム名'}</p>
            <p className="text-sm text-muted-foreground">{settings.gym_address || '住所'}</p>
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              {settings.gym_phone && <span>TEL: {settings.gym_phone}</span>}
              {settings.gym_email && <span>Email: {settings.gym_email}</span>}
            </div>
            <div className="flex gap-4 mt-2 text-xs">
              {settings.line_official_url && (
                <a href={settings.line_official_url} className="text-green-600 hover:underline" target="_blank" rel="noopener noreferrer">LINE</a>
              )}
              {settings.instagram_url && (
                <a href={settings.instagram_url} className="text-pink-600 hover:underline" target="_blank" rel="noopener noreferrer">Instagram</a>
              )}
              {settings.terms_url && (
                <a href={settings.terms_url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">利用規約</a>
              )}
              {settings.privacy_url && (
                <a href={settings.privacy_url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">プライバシーポリシー</a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading || !hasChanges}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? '保存中...' : 'ジム情報を保存'}
        </Button>
      </div>
    </div>
  )
}
