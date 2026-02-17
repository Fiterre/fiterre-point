const LINE_API_BASE = 'https://api.line.me/v2/bot'

interface LineMessage {
  type: 'text' | 'flex'
  text?: string
  altText?: string
  contents?: object
}

interface LineProfile {
  displayName: string
  userId: string
  pictureUrl?: string
  statusMessage?: string
}

class LineClient {
  private accessToken: string

  constructor() {
    this.accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || ''
  }

  private async request(endpoint: string, method: string, body?: object) {
    const response = await fetch(`${LINE_API_BASE}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('LINE API Error:', error)
      throw new Error(`LINE API Error: ${response.status}`)
    }

    // 空レスポンスの場合
    const text = await response.text()
    return text ? JSON.parse(text) : {}
  }

  // プッシュメッセージ送信
  async pushMessage(userId: string, messages: LineMessage[]): Promise<void> {
    await this.request('/message/push', 'POST', {
      to: userId,
      messages: messages.slice(0, 5), // 最大5メッセージ
    })
  }

  // テキストメッセージを送信
  async sendText(userId: string, text: string): Promise<void> {
    await this.pushMessage(userId, [{ type: 'text', text }])
  }

  // Flexメッセージを送信
  async sendFlex(userId: string, altText: string, contents: object): Promise<void> {
    await this.pushMessage(userId, [{
      type: 'flex',
      altText,
      contents,
    }])
  }

  // ユーザープロフィール取得
  async getProfile(userId: string): Promise<LineProfile> {
    return await this.request(`/profile/${userId}`, 'GET')
  }

  // 設定確認
  isConfigured(): boolean {
    return Boolean(this.accessToken)
  }
}

export const lineClient = new LineClient()

// メッセージテンプレート
export function createReservationConfirmMessage(
  userName: string,
  date: string,
  time: string,
  mentorName: string
): LineMessage[] {
  return [{
    type: 'flex',
    altText: '予約が確定しました',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'text',
          text: '予約確定',
          weight: 'bold',
          size: 'xl',
          color: '#059669'
        }]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `${userName}様`,
            size: 'md',
            color: '#666666'
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: '日時', color: '#666666', flex: 1 },
                  { type: 'text', text: `${date} ${time}`, weight: 'bold', flex: 2 }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: '担当', color: '#666666', flex: 1 },
                  { type: 'text', text: mentorName, weight: 'bold', flex: 2 }
                ]
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'text',
          text: 'ご来店をお待ちしております',
          size: 'sm',
          color: '#999999',
          align: 'center'
        }]
      }
    }
  }]
}

export function createCancelConfirmMessage(
  userName: string,
  date: string,
  refundedCoins: number
): LineMessage[] {
  return [{
    type: 'flex',
    altText: '予約がキャンセルされました',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'text',
          text: '予約キャンセル',
          weight: 'bold',
          size: 'xl',
          color: '#DC2626'
        }]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `${userName}様の予約がキャンセルされました`,
            wrap: true
          },
          {
            type: 'text',
            text: `対象日: ${date}`,
            margin: 'md',
            color: '#666666'
          },
          refundedCoins > 0 ? {
            type: 'text',
            text: `${refundedCoins.toLocaleString()} SC を返還しました`,
            margin: 'md',
            color: '#059669',
            weight: 'bold'
          } : {
            type: 'text',
            text: 'キャンセル期限を過ぎているため、コインは返還されません',
            margin: 'md',
            color: '#DC2626',
            wrap: true,
            size: 'sm'
          }
        ]
      }
    }
  }]
}

export function createMonthlyReportMessage(
  userName: string,
  month: string,
  highlights: string
): LineMessage[] {
  return [{
    type: 'flex',
    altText: `${month}のトレーニング記録`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#FEF3C7',
        contents: [{
          type: 'text',
          text: `${month} 努力の軌跡`,
          weight: 'bold',
          size: 'lg',
          color: '#92400E'
        }]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `${userName}様`,
            color: '#666666'
          },
          {
            type: 'text',
            text: highlights,
            wrap: true,
            margin: 'md'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'button',
          action: {
            type: 'uri',
            label: '詳細を見る',
            uri: `${process.env.NEXT_PUBLIC_APP_URL || 'https://fiterre.app'}/dashboard/records`
          },
          style: 'primary',
          color: '#F59E0B'
        }]
      }
    }
  }]
}
