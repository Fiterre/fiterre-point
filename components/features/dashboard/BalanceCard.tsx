import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Coins } from 'lucide-react'

interface BalanceCardProps {
  available: number
  locked: number
  total: number
}

export default function BalanceCard({ available, locked, total }: BalanceCardProps) {
  const formatNumber = (num: number) => {
    return num.toLocaleString('ja-JP')
  }

  return (
    <Card className="bg-gradient-to-br from-amber-400 to-amber-600 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-6 w-6" />
          コイン残高
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold">{formatNumber(available)} SC</div>
        <div className="mt-4 space-y-1 text-amber-100 text-sm">
          <div className="flex justify-between">
            <span>ロック中:</span>
            <span>{formatNumber(locked)} SC</span>
          </div>
          <div className="flex justify-between border-t border-amber-300/30 pt-1">
            <span>合計:</span>
            <span>{formatNumber(total)} SC</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
