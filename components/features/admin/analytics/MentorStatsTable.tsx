interface MentorStat {
  mentorId: string
  mentorName: string
  totalSessions: number
  totalCustomers: number
  totalCoins: number
}

interface Props {
  stats: MentorStat[]
}

export default function MentorStatsTable({ stats }: Props) {
  if (stats.length === 0) {
    return (
      <p className="text-center py-8 text-muted-foreground">
        今月のデータがありません
      </p>
    )
  }

  return (
    <table className="w-full">
      <thead className="bg-muted">
        <tr>
          <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">メンター</th>
          <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">セッション数</th>
          <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">顧客数</th>
          <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">コイン消費</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {stats.map((stat, index) => (
          <tr key={stat.mentorId} className="hover:bg-accent">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-sm font-bold text-primary">
                  {index + 1}
                </div>
                <span className="font-medium">{stat.mentorName}</span>
              </div>
            </td>
            <td className="text-right px-4 py-3 font-medium">
              {stat.totalSessions}回
            </td>
            <td className="text-right px-4 py-3 text-muted-foreground">
              {stat.totalCustomers}名
            </td>
            <td className="text-right px-4 py-3 text-primary font-medium">
              {stat.totalCoins.toLocaleString()} SC
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
