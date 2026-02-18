import { getUserById, getUserBalanceAdmin } from '@/lib/queries/users'
import { getCustomerDetails } from '@/lib/queries/customers'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Coins, Calendar, User, Phone } from 'lucide-react'
import Link from 'next/link'
import GrantCoinsForm from '@/components/features/admin/GrantCoinsForm'
import CustomerRankBadge from '@/components/features/admin/customers/CustomerRankBadge'
import FitestCountdown from '@/components/features/admin/customers/FitestCountdown'
import CustomerLoginInfo from '@/components/features/admin/customers/CustomerLoginInfo'
import UserStatusActions from '@/components/features/admin/customers/UserStatusActions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params
  const [user, balance, details] = await Promise.all([
    getUserById(id),
    getUserBalanceAdmin(id),
    getCustomerDetails(id)
  ])

  if (!user) {
    notFound()
  }

  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      bronze: 'bg-amber-700 text-white',
      silver: 'bg-gray-400 text-white',
      gold: 'bg-yellow-500 text-white',
      platinum: 'bg-gray-600 text-white',
      diamond: 'bg-cyan-400 text-white',
    }
    return colors[rank] || colors.bronze
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/users"
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {user.display_name || '名前未設定'}
            </h1>
            <CustomerRankBadge rank={user.rank} />
          </div>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左カラム: 基本情報 */}
        <div className="lg:col-span-2 space-y-6">
          {/* ユーザー情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                基本情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ステータス</p>
                  <Badge className={
                    user.status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'
                  }>
                    {user.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ランク</p>
                  <Badge className={getRankColor(user.rank)}>
                    {user.rank.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">電話番号</p>
                  <p className="font-medium flex items-center gap-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {user.phone || '未設定'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">登録日</p>
                  <p className="font-medium">
                    {new Date(user.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">来店回数</p>
                  <p className="font-medium">{user.total_visits || 0}回</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">累計支払額</p>
                  <p className="font-medium">¥{(user.lifetime_value_jpy || 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* プラン情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                契約プラン
              </CardTitle>
            </CardHeader>
            <CardContent>
              {details?.subscription ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div>
                      <p className="font-bold text-primary">{details.subscription.plan_name}</p>
                      <p className="text-sm text-primary/70">
                        ¥{details.subscription.price_jpy?.toLocaleString()}/月
                      </p>
                    </div>
                    <Badge className="bg-green-500/10 text-green-600">
                      {details.subscription.status}
                    </Badge>
                  </div>
                  {details.subscription.current_period_end && (
                    <p className="text-sm text-muted-foreground">
                      次回更新: {new Date(details.subscription.current_period_end).toLocaleDateString('ja-JP')}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">契約プランがありません</p>
              )}
            </CardContent>
          </Card>

          {/* コイン付与フォーム */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                コイン付与
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GrantCoinsForm userId={id} userName={user.display_name || user.email} />
            </CardContent>
          </Card>

          {/* ユーザーアクション */}
          <UserStatusActions userId={id} currentStatus={user.status} userName={user.display_name || user.email} />
        </div>

        {/* 右カラム: サイドバー */}
        <div className="space-y-6">
          {/* コイン残高 */}
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-primary-foreground flex items-center gap-2">
                <Coins className="h-5 w-5" />
                コイン残高
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{balance.available.toLocaleString()} SC</p>
              <div className="mt-4 space-y-1 text-primary-foreground/70 text-sm">
                <div className="flex justify-between">
                  <span>ロック中:</span>
                  <span>{balance.locked.toLocaleString()} SC</span>
                </div>
                <div className="flex justify-between border-t border-primary-foreground/20 pt-1">
                  <span>合計:</span>
                  <span>{balance.total.toLocaleString()} SC</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fitestカウントダウン */}
          <FitestCountdown
            userId={id}
            currentRank={user.rank}
            lastFitestDate={details?.lastFitestDate}
          />

          {/* ログイン情報 */}
          <CustomerLoginInfo
            userId={id}
            email={user.email}
            lastLoginAt={details?.lastLoginAt}
          />
        </div>
      </div>
    </div>
  )
}
