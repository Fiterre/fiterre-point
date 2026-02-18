import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Clock, Shield } from 'lucide-react'

interface Props {
  userId: string
  email: string
  lastLoginAt: string | null
}

export default function CustomerLoginInfo({ userId, email, lastLoginAt }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5" />
          ログイン情報
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">メールアドレス</p>
          <p className="font-medium flex items-center gap-1 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground/70" />
            {email}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">最終ログイン</p>
          <p className="font-medium flex items-center gap-1 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground/70" />
            {lastLoginAt
              ? new Date(lastLoginAt).toLocaleString('ja-JP')
              : '情報なし'
            }
          </p>
        </div>

        <div className="text-xs text-muted-foreground/70">
          ID: {userId.slice(0, 8)}...
        </div>
      </CardContent>
    </Card>
  )
}
