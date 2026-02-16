import { createAdminClient } from '@/lib/supabase/admin'
import { getMentorShifts } from '@/lib/queries/shifts'
import { getAllTiers, getUserTier } from '@/lib/queries/permissions'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Shield } from 'lucide-react'
import Link from 'next/link'
import TierBadge from '@/components/features/auth/TierBadge'
import MentorTierSelector from '@/components/features/admin/mentors/MentorTierSelector'
import { DAY_OF_WEEK_LABELS } from '@/lib/queries/shifts'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MentorDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = createAdminClient()

  // メンター情報を取得
  const { data: mentor, error } = await supabase
    .from('mentors')
    .select(`
      *,
      profiles:user_id (
        id,
        display_name,
        email,
        phone,
        status
      )
    `)
    .eq('id', id)
    .single()

  if (error || !mentor) {
    notFound()
  }

  // シフト・Tier情報を取得
  const [shifts, tiers, userTier] = await Promise.all([
    getMentorShifts(id),
    getAllTiers(),
    mentor.profiles?.id ? getUserTier(mentor.profiles.id) : null
  ])

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link href="/admin/mentors" className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {mentor.profiles?.display_name || '名前未設定'}
            </h1>
            {userTier?.tier && (
              <TierBadge tierLevel={userTier.tier.tier_level} tierName={userTier.tier.tier_name} />
            )}
            {!mentor.is_active && (
              <Badge variant="outline" className="text-gray-400">非アクティブ</Badge>
            )}
          </div>
          <p className="text-gray-600">{mentor.profiles?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">専門分野</p>
                <p className="font-medium">{mentor.specialty || '未設定'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">電話番号</p>
                <p className="font-medium">{mentor.profiles?.phone || '未設定'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ステータス</p>
                <Badge className={mentor.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {mentor.is_active ? 'アクティブ' : '非アクティブ'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">アカウント状態</p>
                <Badge className={mentor.profiles?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {mentor.profiles?.status || '不明'}
                </Badge>
              </div>
            </div>
            {mentor.bio && (
              <div>
                <p className="text-sm text-gray-500">自己紹介</p>
                <p className="text-sm mt-1">{mentor.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 権限設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              権限Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MentorTierSelector
              mentorId={mentor.id}
              userId={mentor.profiles?.id}
              currentTierId={userTier?.tier_id}
              tiers={tiers}
            />
          </CardContent>
        </Card>

        {/* シフト */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                シフト
              </span>
              <Link href="/admin/shifts">
                <span className="text-sm text-amber-600 hover:underline">シフト管理へ →</span>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shifts.length === 0 ? (
              <p className="text-center py-4 text-gray-500">シフトが登録されていません</p>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map(day => {
                  const dayShifts = shifts.filter(s => s.day_of_week === day)
                  return (
                    <div key={day} className="text-center">
                      <div className={`font-medium mb-2 ${day === 0 ? 'text-red-600' : day === 6 ? 'text-blue-600' : ''}`}>
                        {DAY_OF_WEEK_LABELS[day]}
                      </div>
                      {dayShifts.length === 0 ? (
                        <div className="text-gray-300 text-sm">−</div>
                      ) : (
                        dayShifts.map(shift => (
                          <div key={shift.id} className="text-xs bg-emerald-100 text-emerald-800 rounded px-1 py-0.5 mb-1">
                            {shift.start_time.slice(0, 5)}〜{shift.end_time.slice(0, 5)}
                          </div>
                        ))
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
