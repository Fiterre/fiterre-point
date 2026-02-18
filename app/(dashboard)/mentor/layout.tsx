export const dynamic = 'force-dynamic'

import { getCurrentUser, isMentor } from '@/lib/queries/auth'
import { getUserTier } from '@/lib/queries/permissions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  ClipboardList,
  Award,
  UserCheck,
  Users,
  LogOut
} from 'lucide-react'
import TierBadge from '@/components/features/auth/TierBadge'

const navItems = [
  { href: '/mentor', label: 'ホーム', icon: Home },
  { href: '/mentor/records', label: 'トレーニング記録', icon: ClipboardList },
  { href: '/mentor/fitest', label: 'Fitest', icon: Award },
  { href: '/mentor/checkin', label: 'チェックイン', icon: UserCheck },
]

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

  return (
    <div className="min-h-screen bg-background">
      {/* モバイルヘッダー */}
      <header className="lg:hidden bg-sidebar text-sidebar-foreground sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/mentor" className="font-bold text-xl">
            Mentor
          </Link>
          {tierData?.tier && (
            <TierBadge tierLevel={tierData.tier.tier_level} tierName={tierData.tier.tier_name} />
          )}
        </div>
      </header>

      <div className="flex">
        {/* サイドバー（デスクトップ） */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-sidebar text-sidebar-foreground">
          <div className="flex items-center justify-between h-16 px-6 bg-sidebar/80">
            <Link href="/mentor" className="font-bold text-xl">
              Mentor
            </Link>
            {tierData?.tier && (
              <TierBadge tierLevel={tierData.tier.tier_level} tierName={tierData.tier.tier_name} />
            )}
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-sidebar-border">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors mb-2"
            >
              <Users className="h-5 w-5" />
              <span>ユーザー画面へ</span>
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-sidebar z-40">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1 text-sidebar-foreground/70"
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
