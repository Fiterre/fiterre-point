import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MessageCircle, Bell, User } from 'lucide-react'
import LineConnectButton from '@/components/features/settings/LineConnectButton'
import NotificationSettings from '@/components/features/settings/NotificationSettings'

export default async function UserSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // プロフィール情報を取得
  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('display_name, rank, line_user_id')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">設定</h1>
        <p className="text-gray-600">アカウントと通知の設定</p>
      </div>

      {/* LINE連携 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            LINE連携
          </CardTitle>
          <CardDescription>
            LINEを連携すると予約確認やお知らせをLINEで受け取れます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LineConnectButton
            userId={user.id}
            isConnected={Boolean(profile?.line_user_id)}
          />
        </CardContent>
      </Card>

      {/* 通知設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知設定
          </CardTitle>
          <CardDescription>
            受け取る通知の種類を選択できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationSettings userId={user.id} />
        </CardContent>
      </Card>

      {/* アカウント情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            アカウント情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">メールアドレス</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">表示名</p>
            <p className="font-medium">{profile?.display_name || '未設定'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">ランク</p>
            <p className="font-medium capitalize">{profile?.rank || 'bronze'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
