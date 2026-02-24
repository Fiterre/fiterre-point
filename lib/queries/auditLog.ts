import { createAdminClient } from '@/lib/supabase/admin'

export type AuditAction =
  | 'user_status_changed'
  | 'mentor_created'
  | 'mentor_updated'
  | 'mentor_deleted'
  | 'mentor_tier_changed'
  | 'coins_granted'
  | 'coins_bulk_granted'
  | 'coins_extended'
  | 'shift_created'
  | 'shift_deleted'
  | 'reservation_blocked'
  | 'recurring_created'
  | 'recurring_executed'
  | 'recurring_deleted'
  | 'settings_updated'

export interface AuditLogEntry {
  actor_id: string
  action: AuditAction
  resource_type: string
  resource_id?: string
  changes?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

/**
 * 監査ログを記録する。
 * audit_logsテーブルが存在しない場合はconsole.warnで警告のみ出す（graceful degradation）。
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        actor_id: entry.actor_id,
        action: entry.action,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id || null,
        changes: entry.changes || null,
        metadata: entry.metadata || null,
        created_at: new Date().toISOString(),
      })

    if (error) {
      // テーブルが存在しない場合(42P01)は警告のみ
      if (error.code === '42P01') {
        console.warn('audit_logs table does not exist. Skipping audit log.')
        return
      }
      console.error('Failed to write audit log:', error)
    }
  } catch (err) {
    // 監査ログ書き込み失敗は本体処理をブロックしない
    console.error('Audit log error:', err)
  }
}
