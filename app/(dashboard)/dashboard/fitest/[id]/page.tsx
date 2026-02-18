import { getCurrentUser } from '@/lib/queries/auth'
import { getFitestResultById } from '@/lib/queries/fitest'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Trophy, XCircle, Brain, Dumbbell, Scale, User } from 'lucide-react'
import Link from 'next/link'
import { FITEST_LEVEL_LABELS, FitestLevel } from '@/types/database'

interface Props {
  params: Promise<{ id: string }>
}

export default async function FitestDetailPage({ params }: Props) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const result = await getFitestResultById(id)

  if (!result || result.user_id !== user.id) {
    notFound()
  }

  const date = new Date(result.test_date)
  const formattedDate = date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/fitest"
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {result.passed ? (
              <Badge className="bg-green-500 text-white">合格</Badge>
            ) : (
              <Badge className="bg-gray-400 text-white">不合格</Badge>
            )}
            <span className="text-muted-foreground">
              {FITEST_LEVEL_LABELS[result.current_level as FitestLevel]} → {FITEST_LEVEL_LABELS[result.target_level as FitestLevel]}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mt-1">Fitest結果</h1>
        </div>
      </div>

      {/* メタ情報 */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {formattedDate}
        </span>
        {result.mentors?.profiles?.display_name && (
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            担当: {result.mentors.profiles.display_name}
          </span>
        )}
      </div>

      {/* 総合結果 */}
      <Card className={result.passed ? 'bg-green-50 border-green-200' : 'bg-muted'}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-6">
            <div className={`p-4 rounded-full ${result.passed ? 'bg-green-500/10' : 'bg-muted'}`}>
              {result.passed ? (
                <Trophy className="h-12 w-12 text-green-600" />
              ) : (
                <XCircle className="h-12 w-12 text-muted-foreground/70" />
              )}
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold">{result.total_score || 0}</p>
              <p className="text-muted-foreground">総合スコア</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 詳細結果 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 神経衰弱 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-5 w-5 text-purple-500" />
              神経衰弱
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">
              {result.memory_game_score ?? '-'}
              <span className="text-lg text-muted-foreground/70">/100</span>
            </p>
            {result.memory_game_accuracy && (
              <p className="text-sm text-muted-foreground mt-1">
                正確性: {result.memory_game_accuracy}%
              </p>
            )}
            {result.memory_game_notes && (
              <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                {result.memory_game_notes}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Big3 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Dumbbell className="h-5 w-5 text-red-500" />
              Big3
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {result.big3_total ?? '-'}
              <span className="text-lg text-muted-foreground/70">kg</span>
            </p>
            <div className="text-sm text-muted-foreground mt-1 space-y-1">
              {result.bench_press_1rm && <p>ベンチ: {result.bench_press_1rm}kg</p>}
              {result.squat_1rm && <p>スクワット: {result.squat_1rm}kg</p>}
              {result.deadlift_1rm && <p>デッドリフト: {result.deadlift_1rm}kg</p>}
            </div>
            {result.big3_notes && (
              <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                {result.big3_notes}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 体重予測 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="h-5 w-5 text-blue-500" />
              体重予測
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              ±{result.weight_difference !== null ? Math.abs(result.weight_difference).toFixed(1) : '-'}
              <span className="text-lg text-muted-foreground/70">kg</span>
            </p>
            <div className="text-sm text-muted-foreground mt-1">
              {result.weight_predicted && <p>予測: {result.weight_predicted}kg</p>}
              {result.weight_actual && <p>実測: {result.weight_actual}kg</p>}
            </div>
            {result.weight_notes && (
              <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                {result.weight_notes}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 総評 */}
      {result.overall_notes && (
        <Card>
          <CardHeader>
            <CardTitle>メンターからのコメント</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap">{result.overall_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
