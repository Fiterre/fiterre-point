import { redirect } from 'next/navigation'
import { getCurrentUser, isMentor } from '@/lib/queries/auth'
import { getUserTier } from '@/lib/queries/permissions'
import { Toaster } from '@/components/ui/sonner'
import Link from 'next/link'
import LogoutButton from '@/components/features/auth/LogoutButton'
import TierBadge from '@/components/features/auth/TierBadge'
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  Clock,
  FileText,
  UserCheck
} from 'lucide-react'

export default async function MentorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const mentor = await isMentor(user.id)

  if (!mentor) {
    redirect('/dashboard')
  }

  const tierData = await getUserTier(user.id)

  const navItems = [
    { href: '/mentor', label: 'ダッシュボード', icon: LayoutDashboard },
    { href: '/mentor/customers', label: '担当顧客', icon: Users },
    { href: '/mentor/schedule', label: '予約スケジュール', icon: Calendar },
    { href: '/mentor/shifts', label: 'マイシフト', icon: Clock },
    { href: '/mentor/records', label: 'トレーニング記録', icon: ClipboardList },
    { href: '/mentor/fitest', label: 'Fitest', icon: FileText },
    { href: '/mentor/checkin', label: 'チェックイン', icon: UserCheck },
  ]

  return (
    <div className="flex min-h-screen">
      {/* サイドバー */}
      <aside className="w-64 bg-emerald-900 text-white">
        <div className="p-4 border-b border-emerald-700">
          <h2 className="text-lg font-bold text-emerald-300">メンターパネル</h2>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-emerald-200">{user.email}</span>
          </div>
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
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-emerald-800 transition-colors"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 space-y-2">
          <Link
            href="/dashboard"
            className="block text-sm text-emerald-300 hover:text-white"
          >
            ← ユーザー画面へ
          </Link>
          <LogoutButton />
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 bg-gray-100 p-8">
        {children}
      </main>
      <Toaster />
    </div>
  )
}
