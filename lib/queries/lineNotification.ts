import { createAdminClient } from '@/lib/supabase/admin'
import { lineClient, createReservationConfirmMessage, createCancelConfirmMessage, createMonthlyReportMessage } from '@/lib/line/client'

// LINE通知を送信（ユーザーIDからLINE IDを取得）
async function getLineUserId(userId: string): Promise<string | null> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('profiles')
    .select('line_user_id')
    .eq('id', userId)
    .single()

  return data?.line_user_id || null
}

// 予約確定通知
export async function sendReservationConfirmNotification(
  userId: string,
  userName: string,
  date: string,
  time: string,
  mentorName: string
): Promise<boolean> {
  try {
    if (!lineClient.isConfigured()) {
      console.log('LINE API not configured, skipping notification')
      return false
    }

    const lineUserId = await getLineUserId(userId)
    if (!lineUserId) {
      console.log('User has no LINE ID linked')
      return false
    }

    const messages = createReservationConfirmMessage(userName, date, time, mentorName)
    await lineClient.pushMessage(lineUserId, messages)

    return true
  } catch (error) {
    console.error('Failed to send LINE notification:', error)
    return false
  }
}

// キャンセル通知
export async function sendCancelNotification(
  userId: string,
  userName: string,
  date: string,
  refundedCoins: number
): Promise<boolean> {
  try {
    if (!lineClient.isConfigured()) {
      return false
    }

    const lineUserId = await getLineUserId(userId)
    if (!lineUserId) {
      return false
    }

    const messages = createCancelConfirmMessage(userName, date, refundedCoins)
    await lineClient.pushMessage(lineUserId, messages)

    return true
  } catch (error) {
    console.error('Failed to send cancel notification:', error)
    return false
  }
}

// 月次レポート通知
export async function sendMonthlyReportNotification(
  userId: string,
  userName: string,
  month: string,
  highlights: string
): Promise<boolean> {
  try {
    if (!lineClient.isConfigured()) {
      return false
    }

    const lineUserId = await getLineUserId(userId)
    if (!lineUserId) {
      return false
    }

    const messages = createMonthlyReportMessage(userName, month, highlights)
    await lineClient.pushMessage(lineUserId, messages)

    return true
  } catch (error) {
    console.error('Failed to send monthly report notification:', error)
    return false
  }
}

// テキストメッセージ送信
export async function sendTextNotification(
  userId: string,
  text: string
): Promise<boolean> {
  try {
    if (!lineClient.isConfigured()) {
      return false
    }

    const lineUserId = await getLineUserId(userId)
    if (!lineUserId) {
      return false
    }

    await lineClient.sendText(lineUserId, text)
    return true
  } catch (error) {
    console.error('Failed to send text notification:', error)
    return false
  }
}
