import { getUserById, getUserBalanceAdmin } from '@/lib/queries/users'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import GrantCoinsForm from '@/components/features/admin/GrantCoinsForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params
  const user = await getUserById(id)

  if (!user) {
    notFound()
  }

  const balance = await getUserBalanceAdmin(id)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/users"
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user.display_name || '名前未設定'}
          </h1>
          <p className="text-gray-600">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ユーザー情報 */}
        <Card>
          <CardHeader>
            <CardTitle>ユーザー情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">ステータス</p>
                <Badge className={
                  user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }>
                  {user.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">ランク</p>
                <p className="font-medium">{user.rank}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">電話番号</p>
                <p className="font-medium">{user.phone || '未設定'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">登録日</p>
                <p className="font-medium">
                  {new Date(user.created_at).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* コイン残高 */}
        <Card>
          <CardHeader>
            <CardTitle>コイン残高</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-amber-600">
                {balance.available.toLocaleString()} SC
              </p>
              <p className="text-sm text-gray-500 mt-2">
                ロック中: {balance.locked.toLocaleString()} SC
              </p>
              <p className="text-sm text-gray-500">
                合計: {balance.total.toLocaleString()} SC
              </p>
            </div>
          </CardContent>
        </Card>

        {/* コイン付与フォーム */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>コイン付与</CardTitle>
          </CardHeader>
          <CardContent>
            <GrantCoinsForm userId={id} userName={user.display_name || user.email} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
