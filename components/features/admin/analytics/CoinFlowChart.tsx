'use client'

interface DataPoint {
  date: string
  granted: number
  spent: number
}

interface Props {
  data: DataPoint[]
}

export default function CoinFlowChart({ data }: Props) {
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.granted, d.spent)),
    1
  )

  // 直近7日分を表示
  const recentData = data.slice(-7)

  return (
    <div className="space-y-4">
      {/* 棒グラフ（付与と消費） */}
      <div className="flex items-end gap-2 h-40">
        {recentData.map((point, index) => {
          const grantedHeight = (point.granted / maxValue) * 100
          const spentHeight = (point.spent / maxValue) * 100
          const date = new Date(point.date)
          const dayLabel = date.toLocaleDateString('ja-JP', { weekday: 'short' })

          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="flex gap-1 items-end h-full w-full">
                <div
                  className="flex-1 bg-green-500 rounded-t"
                  style={{ height: `${Math.max(grantedHeight, 2)}%` }}
                />
                <div
                  className="flex-1 bg-red-400 rounded-t"
                  style={{ height: `${Math.max(spentHeight, 2)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{dayLabel}</p>
            </div>
          )
        })}
      </div>

      {/* 凡例 */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span>付与</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-400 rounded" />
          <span>消費</span>
        </div>
      </div>
    </div>
  )
}
