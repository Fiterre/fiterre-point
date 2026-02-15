import { getAllUsers } from '@/lib/queries/users'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function AdminUsersPage() {
  const users = await getAllUsers()

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-purple-100 text-purple-800',
      trainer: 'bg-blue-100 text-blue-800',
      user: 'bg-gray-100 text-gray-800',
    }
    return colors[role] || colors.user
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      locked: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      deleted: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || colors.active
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
          <p className="text-gray-600">全{users.length}名のユーザー</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">ユーザー</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">ロール</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">ステータス</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">ランク</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">登録日</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{user.display_name || '名前未設定'}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getRoleBadge(user.user_roles?.role || 'user')}>
                      {user.user_roles?.role || 'user'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getStatusBadge(user.status)}>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">{user.rank}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                    >
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <p className="text-center py-8 text-gray-500">ユーザーがいません</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
