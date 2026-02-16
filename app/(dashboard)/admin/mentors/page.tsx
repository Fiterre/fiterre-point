import { getMentors } from '@/lib/queries/reservations'
import { getAllTiers } from '@/lib/queries/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users } from 'lucide-react'
import Link from 'next/link'

export default async function AdminMentorsPage() {
  const [mentors, tiers] = await Promise.all([
    getMentors(),
    getAllTiers()
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">メンター管理</h1>
          <p className="text-gray-600">メンターの一覧・権限・シフト管理</p>
        </div>
        <Link href="/admin/mentors/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            メンター追加
          </Button>
        </Link>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">アクティブメンター</p>
                <p className="text-2xl font-bold">
                  {mentors.filter(m => m.is_active).length}名
                </p>
              </div>
              <Users className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">非アクティブ</p>
                <p className="text-2xl font-bold text-gray-400">
                  {mentors.filter(m => !m.is_active).length}名
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tierテンプレート</p>
                <p className="text-2xl font-bold">{tiers.length}種類</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* メンター一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>メンター一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {mentors.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              メンターが登録されていません
            </p>
          ) : (
            <div className="space-y-3">
              {mentors.map((mentor) => (
                <Link
                  key={mentor.id}
                  href={`/admin/mentors/${mentor.id}`}
                  className="block"
                >
                  <div className={`flex items-center justify-between p-4 rounded-lg border hover:shadow-md transition-shadow ${
                    mentor.is_active ? 'bg-white' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-emerald-600 font-bold">
                          {(mentor.profiles?.display_name || 'M')[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {mentor.profiles?.display_name || '名前未設定'}
                          </p>
                          {!mentor.is_active && (
                            <Badge variant="outline" className="text-gray-400">
                              非アクティブ
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {mentor.specialty || '専門分野未設定'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">詳細を見る →</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
