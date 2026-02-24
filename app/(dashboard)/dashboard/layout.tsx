export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/queries/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Calendar,
  Coins,
  ClipboardList,
  Award,
  QrCode,
  ArrowLeftRight,
  Settings,
  LogOut
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'ホーム', icon: Home },
  { href: '/dashboard/reservations', label: '予約', icon: Calendar },
  { href: '/dashboard/history', label: 'コイン', icon: Coins },
  { href: '/dashboard/exchanges', label: '交換', icon: ArrowLeftRight },
  { href: '/dashboard/records', label: '記録', icon: ClipboardList },
  { href: '/dashboard/fitest', label: 'Fitest', icon: Award },
  { href: '/dashboard/checkin', label: 'チェックイン', icon: QrCode },
  { href: '/dashboard/settings', label: '設定', icon: Settings },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* モバイルヘッダー */}
      <header className="lg:hidden bg-card border-b border-border sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/dashboard" className="font-bold text-xl text-primary">
            Stella Coin
          </Link>
        </div>
      </header>

      <div className="flex">
        {/* サイドバー（デスクトップ） */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r border-border">
          <div className="flex items-center h-16 px-6 border-b border-border">
            <Link href="/dashboard" className="font-bold text-xl text-primary">
              Stella Coin
            </Link>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground hover:bg-accent hover:text-primary transition-colors"
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-border">
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground hover:text-primary"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* モバイル用の下部余白 */}
      <div className="lg:hidden h-16" />
    </div>
  )
}
