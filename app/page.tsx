import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-amber-600">Stella Coin</h1>
        <p className="text-xl text-gray-600">
          Fiterre パーソナルジム会員専用ポイントシステム
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg">ログイン</Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" variant="outline">新規登録</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
