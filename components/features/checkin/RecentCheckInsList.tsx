import { Badge } from '@/components/ui/badge'
import { User, Clock, Coins } from 'lucide-react'
import { CheckInLogWithRelations } from '@/types/database'

interface Props {
  checkIns: CheckInLogWithRelations[]
}

const METHOD_LABELS: { [key: string]: string } = {
  code: 'コード入力',
  qr: 'QRスキャン',
  manual: '手動'
}

export default function RecentCheckInsList({ checkIns }: Props) {
  if (checkIns.length === 0) {
    return (
      <p className="text-center py-8 text-gray-500">
        本日のチェックインはまだありません
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {checkIns.map(checkIn => {
        const time = new Date(checkIn.check_in_at)
        const formattedTime = time.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        })
        const formattedDate = time.toLocaleDateString('ja-JP', {
          month: 'short',
          day: 'numeric'
        })

        return (
          <div
            key={checkIn.id}
            className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
          >
            <div className="p-2 bg-green-100 rounded-full">
              <User className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {checkIn.profiles?.display_name || checkIn.profiles?.email || '顧客'}
              </p>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{formattedDate} {formattedTime}</span>
                <Badge variant="outline" className="text-xs">
                  {METHOD_LABELS[checkIn.method] || checkIn.method}
                </Badge>
              </div>
            </div>
            {checkIn.bonus_coins_granted > 0 && (
              <div className="flex items-center gap-1 text-amber-600">
                <Coins className="h-4 w-4" />
                <span className="font-medium">+{checkIn.bonus_coins_granted}</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
