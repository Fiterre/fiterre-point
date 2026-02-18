import { getCurrentUser, isAdmin } from '@/lib/queries/auth'
import { getUserTier } from '@/lib/queries/permissions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Users,
  Coins,
  UserCog,
  BarChart3,
  Settings,
  Calendar,
  CalendarClock,
  CalendarOff,
  LogOut,
  ArrowLeft
} from 'lucide-react'
import TierBadge from '@/components/features/auth/TierBadge'

const navItems = [
  { href: '/admin', label: 'ダッシュボード', icon: Home },
  { href: '/admin/users', label: 'ユーザー管理', icon: Users },
  { href: '/admin/coins', label: 'コイン管理', icon: Coins },
  { href: '/admin/mentors', label: 'メンター管理', icon: UserCog },
  { href: '/admin/shifts', label: 'シフト管理', icon: Calendar },
  { href: '/admin/schedule', label: 'スケジュール', icon: CalendarOff },
  { href: '/admin/recurring', label: '固定予約', icon: CalendarClock },
  { href: '/admin/analytics', label: '分析', icon: BarChart3 },
  { href: '/admin/settings', label: '設定', icon: Settings },
]

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

  const userTier = await getUserTier(user.id)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* モバイルヘッダー */}
      <header className="lg:hidden bg-gray-800 text-white sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/admin" className="font-bold text-xl">
            Admin
          </Link>
          {userTier?.tier && (
            <TierBadge tierLevel={userTier.tier.tier_level} tierName={userTier.tier.tier_name} />
          )}
        </div>
      </header>

      <div className="flex">
        {/* サイドバー（デスクトップ） */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-gray-800 text-white">
          <div className="flex items-center justify-between h-16 px-6 bg-gray-900">
            <Link href="/admin" className="font-bold text-xl">
              Admin
            </Link>
            {userTier?.tier && (
              <TierBadge tierLevel={userTier.tier.tier_level} tierName={userTier.tier.tier_name} />
            )}
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-700">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>ユーザー画面へ</span>
            </Link>
            <Link
              href="/mentor"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-emerald-400 hover:bg-gray-700 transition-colors mb-2"
            >
              <UserCog className="h-5 w-5" />
              <span>メンター画面へ</span>
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>ログアウト</span>
              </button>
            </form>
          </div>
        </aside>

        {/* メインコンテンツ */}
        <main className="flex-1 lg:ml-64">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* モバイルボトムナビ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-800 z-40">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1 text-gray-300"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div className="lg:hidden h-16" />
    </div>
  )
}
