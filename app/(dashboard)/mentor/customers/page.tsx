export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/queries/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Mail, Calendar, Coins } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function MentorCustomersPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = createAdminClient()

  // メンターIDを取得
  const { data: mentor } = await supabase
    .from('mentors')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!mentor) redirect('/mentor')

  // このメンターが担当した予約からユニークな顧客を取得
  const { data: reservations } = await supabase
    .from('reservations')
    .select(`
      user_id,
      reserved_at,
      status,
      profiles:user_id (
        id,
        display_name,
        email,
        rank,
        total_visits
      )
    `)
    .eq('mentor_id', mentor.id)
    .order('reserved_at', { ascending: false })

  // ユニーク顧客を集計
  const customerMap = new Map<string, {
    profile: { id: string; display_name: string | null; email: string; rank: string; total_visits: number }
    totalSessions: number
    lastVisit: string
  }>()

  for (const res of reservations || []) {
    const profile = res.profiles as any
    if (!profile?.id) continue

    const existing = customerMap.get(profile.id)
    if (existing) {
      existing.totalSessions++
      if (res.reserved_at > existing.lastVisit) {
        existing.lastVisit = res.reserved_at
      }
    } else {
      customerMap.set(profile.id, {
        profile: {
          id: profile.id,
          display_name: profile.display_name,
          email: profile.email,
          rank: profile.rank || 'bronze',
          total_visits: profile.total_visits || 0,
        },
        totalSessions: 1,
        lastVisit: res.reserved_at,
      })
    }
  }

  const customers = Array.from(customerMap.values())
    .sort((a, b) => b.lastVisit.localeCompare(a.lastVisit))

  const rankLabel: Record<string, string> = {
    bronze: 'ブロンズ',
    silver: 'シルバー',
    gold: 'ゴールド',
    platinum: 'プラチナ',
    diamond: 'ダイヤモンド',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">担当顧客</h1>
        <p className="text-muted-foreground">あなたが担当した顧客の一覧（{customers.length}名）</p>
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">まだ担当した顧客がいません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {customers.map(({ profile, totalSessions, lastVisit }) => {
            const lastDate = new Date(lastVisit)
            const formatted = lastDate.toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })

            return (
              <Card key={profile.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {profile.display_name || '名前未設定'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {profile.email}
                      </p>
                    </div>
                    <div className="text-right space-y-1 shrink-0">
                      <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                        {rankLabel[profile.rank] || profile.rank}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">担当回数</p>
                      <p className="text-sm font-semibold">{totalSessions}回</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">総来店数</p>
                      <p className="text-sm font-semibold">{profile.total_visits}回</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">最終担当</p>
                      <p className="text-sm font-semibold">{formatted}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
