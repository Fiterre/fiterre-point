'use client'

interface DataPoint {
  date: string
  count: number
}

interface Props {
  data: DataPoint[]
}

export default function ReservationChart({ data }: Props) {
  const maxCount = Math.max(...data.map(d => d.count), 1)

  // 直近7日分を表示
  const recentData = data.slice(-7)

  return (
    <div className="space-y-4">
      {/* シンプルな棒グラフ */}
      <div className="flex items-end gap-2 h-40">
        {recentData.map((point, index) => {
          const height = (point.count / maxCount) * 100
          const date = new Date(point.date)
          const dayLabel = date.toLocaleDateString('ja-JP', { weekday: 'short' })

          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-blue-500 rounded-t transition-all"
                style={{ height: `${Math.max(height, 4)}%` }}
              />
              <p className="text-xs text-gray-500 mt-2">{dayLabel}</p>
              <p className="text-xs font-medium">{point.count}</p>
            </div>
          )
        })}
      </div>

      {/* 合計 */}
      <div className="text-center text-sm text-gray-500">
        過去7日間: {recentData.reduce((sum, d) => sum + d.count, 0)}件
      </div>
    </div>
  )
}
