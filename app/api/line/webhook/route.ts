import * as crypto from 'crypto'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const signature = req.headers.get('x-line-signature')
  if (!signature) {
    return new Response('Missing signature', { status: 401 })
  }

  const rawBody = await req.text()

  const secret = process.env.LINE_CHANNEL_SECRET
  if (!secret) {
    console.error('LINE_CHANNEL_SECRET is not configured')
    return new Response('Server configuration error', { status: 500 })
  }

  const hash = crypto
    .createHmac('SHA256', secret)
    .update(rawBody)
    .digest('base64')

  if (hash !== signature) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Webhook イベント処理
  const body = JSON.parse(rawBody)
  const events = body.events || []

  for (const event of events) {
    // フォローイベント（友だち追加時）
    if (event.type === 'follow') {
      console.log('LINE follow event:', event.source.userId)
    }

    // ブロックイベント（ブロック時）
    if (event.type === 'unfollow') {
      console.log('LINE unfollow event:', event.source.userId)
    }
  }

  return NextResponse.json({ status: 'ok' })
}
