import { redirect } from 'next/navigation'
import { getCurrentUser, isAdmin } from '@/lib/queries/auth'
import { getUserTier } from '@/lib/queries/permissions'
import TierBadge from '@/components/features/auth/TierBadge'
import Link from 'next/link'
import { Users, Coins, Settings, LayoutDashboard, Clock, CalendarClock, UserCog } from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const admin = await isAdmin(user.id)

  if (!admin) {
    redirect('/dashboard')
  }

  const tierData = await getUserTier(user.id)

  const navItems = [
    { href: '/admin', label: 'ダッシュボード', icon: LayoutDashboard },
    { href: '/admin/users', label: 'ユーザー管理', icon: Users },
    { href: '/admin/mentors', label: 'メンター管理', icon: UserCog },
    { href: '/admin/coins', label: 'コイン管理', icon: Coins },
    { href: '/admin/shifts', label: 'シフト管理', icon: Clock },
    { href: '/admin/recurring', label: '固定予約', icon: CalendarClock },
    { href: '/admin/settings', label: '設定', icon: Settings },
  ]

  return (
    <div className="flex min-h-screen">
      {/* サイドバー */}
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-amber-400">管理者パネル</h2>
          {tierData?.tier && (
            <div className="mt-2">
              <TierBadge
                tierLevel={tierData.tier.tier_level}
                tierName={tierData.tier.tier_name}
              />
            </div>
          )}
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4">
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-white"
          >
            ← ユーザー画面に戻る
          </Link>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 bg-gray-100 p-8">
        {children}
      </main>
    </div>
  )
}
