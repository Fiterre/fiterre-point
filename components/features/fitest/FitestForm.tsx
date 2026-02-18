'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Save,
  Loader2,
  Brain,
  Dumbbell,
  Scale,
  Trophy,
  AlertTriangle
} from 'lucide-react'
import { FitestMilestone, FITEST_LEVEL_LABELS, FitestLevel } from '@/types/database'

interface User {
  id: string
  email: string
  display_name: string | null
  rank: string
}

interface Props {
  mentorId: string
  users: User[]
  milestones: FitestMilestone[]
  preselectedUserId?: string
}

const LEVEL_ORDER: FitestLevel[] = ['beginner', 'intermediate', 'advanced', 'master']

export default function FitestForm({ mentorId, users, milestones, preselectedUserId }: Props) {
  const [selectedUserId, setSelectedUserId] = useState(preselectedUserId || '')
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0])
  const [currentLevel, setCurrentLevel] = useState<FitestLevel>('beginner')
  const [targetLevel, setTargetLevel] = useState<FitestLevel>('intermediate')

  // 神経衰弱トレーニング
  const [memoryScore, setMemoryScore] = useState('')
  const [memoryAccuracy, setMemoryAccuracy] = useState('')
  const [memoryNotes, setMemoryNotes] = useState('')

  // Big3計測
  const [benchPress, setBenchPress] = useState('')
  const [squat, setSquat] = useState('')
  const [deadlift, setDeadlift] = useState('')
  const [big3Notes, setBig3Notes] = useState('')

  // 体重予測
  const [weightPredicted, setWeightPredicted] = useState('')
  const [weightActual, setWeightActual] = useState('')
  const [weightNotes, setWeightNotes] = useState('')

  // 総合
  const [overallNotes, setOverallNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  // Big3トータル計算
  const big3Total = (parseFloat(benchPress) || 0) + (parseFloat(squat) || 0) + (parseFloat(deadlift) || 0)

  // 体重誤差計算
  const weightDifference = weightPredicted && weightActual
    ? Math.abs(parseFloat(weightPredicted) - parseFloat(weightActual))
    : null

  // 該当するマイルストーン
  const milestone = milestones.find(m => m.from_level === currentLevel && m.to_level === targetLevel)

  // スコア計算
  const calculateScore = () => {
    let score = 0

    // 神経衰弱（0-100点）
    if (memoryScore) {
      score += Math.min(parseInt(memoryScore), 100)
    }

    // Big3（総重量に応じて0-100点）
    if (big3Total > 0) {
      score += Math.min(Math.max((big3Total - 100) / 2, 0), 100)
    }

    // 体重予測精度（0-100点）
    if (weightDifference !== null) {
      score += Math.max(100 - (weightDifference * 20), 0)
    }

    return Math.round(score)
  }

  const totalScore = calculateScore()

  // 合格判定
  const checkPass = (): boolean => {
    if (!milestone) return false

    if (milestone.min_memory_score && parseInt(memoryScore) < milestone.min_memory_score) {
      return false
    }
    if (milestone.min_big3_total && big3Total < milestone.min_big3_total) {
      return false
    }
    if (milestone.max_weight_difference && weightDifference !== null && weightDifference > milestone.max_weight_difference) {
      return false
    }
    if (milestone.min_total_score && totalScore < milestone.min_total_score) {
      return false
    }

    return true
  }

  const passed = checkPass()

  // ユーザー選択時にレベルを設定
  useEffect(() => {
    const user = users.find(u => u.id === selectedUserId)
    if (user) {
      // rankをcurrentLevelにマッピング
      const rankToLevel: { [key: string]: FitestLevel } = {
        bronze: 'beginner',
        silver: 'intermediate',
        gold: 'advanced',
        platinum: 'advanced',
        diamond: 'advanced'
      }
      const level = rankToLevel[user.rank] || 'beginner'
      setCurrentLevel(level)

      const currentIndex = LEVEL_ORDER.indexOf(level)
      if (currentIndex < LEVEL_ORDER.length - 1) {
        setTargetLevel(LEVEL_ORDER[currentIndex + 1])
      }
    }
  }, [selectedUserId, users])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUserId) {
      toast({ variant: 'destructive', title: 'エラー', description: '顧客を選択してください' })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/mentor/fitest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          testDate,
          currentLevel,
          targetLevel,
          memoryGameScore: memoryScore ? parseInt(memoryScore) : null,
          memoryGameAccuracy: memoryAccuracy ? parseFloat(memoryAccuracy) : null,
          memoryGameNotes: memoryNotes || null,
          benchPress1rm: benchPress ? parseFloat(benchPress) : null,
          squat1rm: squat ? parseFloat(squat) : null,
          deadlift1rm: deadlift ? parseFloat(deadlift) : null,
          big3Total: big3Total || null,
          big3Notes: big3Notes || null,
          weightPredicted: weightPredicted ? parseFloat(weightPredicted) : null,
          weightActual: weightActual ? parseFloat(weightActual) : null,
          weightDifference: weightDifference,
          weightNotes: weightNotes || null,
          totalScore,
          passed,
          overallNotes: overallNotes || null
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '保存に失敗しました')
      }

      toast({
        title: passed ? '合格！' : '結果を保存しました',
        description: passed
          ? `${FITEST_LEVEL_LABELS[targetLevel]}への昇格おめでとうございます！`
          : '次回のチャレンジを応援しています'
      })

      router.push('/mentor/fitest')
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: error instanceof Error ? error.message : 'エラーが発生しました',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>顧客 *</Label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full h-10 px-3 border rounded-md"
                required
              >
                <option value="">選択してください</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.display_name || user.email} ({user.rank})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>実施日 *</Label>
              <Input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>現在のレベル</Label>
              <div className="p-3 bg-muted rounded-md">
                <Badge>{FITEST_LEVEL_LABELS[currentLevel]}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label>目標レベル</Label>
              <div className="p-3 bg-primary/5 rounded-md">
                <Badge className="bg-primary/50">{FITEST_LEVEL_LABELS[targetLevel]}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 神経衰弱トレーニング */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            神経衰弱トレーニング
          </CardTitle>
          <CardDescription>カードをめくり、揃った種目を正確に実施</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>スコア (0-100)</Label>
              <Input
                type="number"
                value={memoryScore}
                onChange={(e) => setMemoryScore(e.target.value)}
                placeholder="85"
                min="0"
                max="100"
              />
            </div>
            <div className="space-y-2">
              <Label>正確性 (%)</Label>
              <Input
                type="number"
                value={memoryAccuracy}
                onChange={(e) => setMemoryAccuracy(e.target.value)}
                placeholder="92.5"
                step="0.1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>メモ</Label>
            <Textarea
              value={memoryNotes}
              onChange={(e) => setMemoryNotes(e.target.value)}
              placeholder="実施時の様子など"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Big3計測 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-red-500" />
            Big3計測
          </CardTitle>
          <CardDescription>ベンチプレス、スクワット、デッドリフトの1RM</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>ベンチプレス (kg)</Label>
              <Input
                type="number"
                value={benchPress}
                onChange={(e) => setBenchPress(e.target.value)}
                placeholder="80"
                step="0.5"
              />
            </div>
            <div className="space-y-2">
              <Label>スクワット (kg)</Label>
              <Input
                type="number"
                value={squat}
                onChange={(e) => setSquat(e.target.value)}
                placeholder="120"
                step="0.5"
              />
            </div>
            <div className="space-y-2">
              <Label>デッドリフト (kg)</Label>
              <Input
                type="number"
                value={deadlift}
                onChange={(e) => setDeadlift(e.target.value)}
                placeholder="140"
                step="0.5"
              />
            </div>
          </div>
          <div className="p-3 bg-muted rounded-md">
            <span className="text-sm text-muted-foreground">Big3トータル: </span>
            <span className="font-bold text-lg">{big3Total.toFixed(1)} kg</span>
          </div>
          <div className="space-y-2">
            <Label>メモ</Label>
            <Textarea
              value={big3Notes}
              onChange={(e) => setBig3Notes(e.target.value)}
              placeholder="フォームの改善点など"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* 体重予測 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-500" />
            体重予測 Hit & Blow
          </CardTitle>
          <CardDescription>自身の体重を予測し、実測値との差を競う</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>予測値 (kg)</Label>
              <Input
                type="number"
                value={weightPredicted}
                onChange={(e) => setWeightPredicted(e.target.value)}
                placeholder="65.0"
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <Label>実測値 (kg)</Label>
              <Input
                type="number"
                value={weightActual}
                onChange={(e) => setWeightActual(e.target.value)}
                placeholder="65.5"
                step="0.1"
              />
            </div>
          </div>
          {weightDifference !== null && (
            <div className={`p-3 rounded-md ${weightDifference <= 1 ? 'bg-green-500/10' : weightDifference <= 3 ? 'bg-yellow-100' : 'bg-red-100'}`}>
              <span className="text-sm text-muted-foreground">誤差: </span>
              <span className={`font-bold ${weightDifference <= 1 ? 'text-green-600' : weightDifference <= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                {weightDifference.toFixed(1)} kg
              </span>
            </div>
          )}
          <div className="space-y-2">
            <Label>メモ</Label>
            <Textarea
              value={weightNotes}
              onChange={(e) => setWeightNotes(e.target.value)}
              placeholder="体重管理の意識など"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* 総合評価 */}
      <Card className={passed ? 'border-green-500 bg-green-50' : 'border-red-300 bg-red-50'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {passed ? (
              <Trophy className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            )}
            総合評価
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg">
              <p className="text-sm text-muted-foreground">総合スコア</p>
              <p className="text-3xl font-bold">{totalScore}<span className="text-lg text-muted-foreground">/300</span></p>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <p className="text-sm text-muted-foreground">判定</p>
              <p className={`text-3xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                {passed ? '合格' : '不合格'}
              </p>
            </div>
          </div>

          {milestone && (
            <div className="p-3 bg-white rounded-lg text-sm">
              <p className="font-medium mb-2">合格基準:</p>
              <ul className="space-y-1 text-muted-foreground">
                {milestone.min_memory_score && (
                  <li>・神経衰弱: {milestone.min_memory_score}点以上</li>
                )}
                {milestone.min_big3_total && (
                  <li>・Big3トータル: {milestone.min_big3_total}kg以上</li>
                )}
                {milestone.max_weight_difference && (
                  <li>・体重誤差: {milestone.max_weight_difference}kg以内</li>
                )}
                {milestone.min_total_score && (
                  <li>・総合スコア: {milestone.min_total_score}点以上</li>
                )}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <Label>総評・コメント</Label>
            <Textarea
              value={overallNotes}
              onChange={(e) => setOverallNotes(e.target.value)}
              placeholder="全体的な評価や次回への課題など"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            保存中...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            結果を保存
          </>
        )}
      </Button>
    </form>
  )
}
