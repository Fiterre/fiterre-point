import { Badge } from '@/components/ui/badge'
import { CheckCircle, Coins, Calendar } from 'lucide-react'
import { CheckInLogWithRelations } from '@/types/database'

interface Props {
  checkIns: CheckInLogWithRelations[]
}

export default function UserCheckInHistory({ checkIns }: Props) {
  if (checkIns.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <p>まだ来店履歴がありません</p>
        <p className="text-sm mt-2">次回のご来店をお待ちしています！</p>
      </div>
    )
  }

  // 月別にグループ化
  const groupedByMonth: { [key: string]: CheckInLogWithRelations[] } = {}
  checkIns.forEach(checkIn => {
    const date = new Date(checkIn.check_in_at)
    const monthKey = `${date.getFullYear()}年${date.getMonth() + 1}月`
    if (!groupedByMonth[monthKey]) {
      groupedByMonth[monthKey] = []
    }
    groupedByMonth[monthKey].push(checkIn)
  })

  return (
    <div className="space-y-6">
      {Object.entries(groupedByMonth).map(([month, monthCheckIns]) => (
        <div key={month}>
          <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {month}（{monthCheckIns.length}回）
          </h3>
          <div className="space-y-2">
            {monthCheckIns.map(checkIn => {
              const date = new Date(checkIn.check_in_at)
              const formattedDate = date.toLocaleDateString('ja-JP', {
                month: 'short',
                day: 'numeric',
                weekday: 'short'
              })
              const formattedTime = date.toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit'
              })

              return (
                <div
                  key={checkIn.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-full">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{formattedDate}</p>
                      <p className="text-sm text-muted-foreground">{formattedTime}</p>
                    </div>
                  </div>
                  {checkIn.bonus_coins_granted > 0 && (
                    <Badge className="bg-primary/10 text-primary">
                      <Coins className="h-3 w-3 mr-1" />
                      +{checkIn.bonus_coins_granted} SC
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
