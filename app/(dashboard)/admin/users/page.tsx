export const dynamic = 'force-dynamic'

import { getAllUsers } from '@/lib/queries/users'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function AdminUsersPage() {
  const users = await getAllUsers()

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-500/10 text-red-500',
      manager: 'bg-purple-500/10 text-purple-500',
      mentor: 'bg-blue-500/10 text-blue-500',
      user: 'bg-muted text-muted-foreground',
    }
    return colors[role] || colors.user
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/10 text-green-600',
      locked: 'bg-yellow-500/10 text-yellow-600',
      suspended: 'bg-red-500/10 text-red-500',
      deleted: 'bg-muted text-muted-foreground',
    }
    return colors[status] || colors.active
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ユーザー管理</h1>
          <p className="text-muted-foreground">全{users.length}名のユーザー</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-muted border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">ユーザー</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">ロール</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">ステータス</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">ランク</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">登録日</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{user.display_name || '名前未設定'}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
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
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-primary hover:text-primary/80 text-sm font-medium"
                    >
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">ユーザーがいません</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
