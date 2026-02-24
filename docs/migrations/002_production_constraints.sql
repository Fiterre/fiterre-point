-- ============================================================
-- 本番運用向け制約・監査ログマイグレーション
-- Supabase Dashboard の SQL Editor で実行してください
-- ============================================================

-- ============================================================
-- 1. audit_logs テーブル（監査ログ）
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    changes JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 管理者のみ読み取り可、書き込みは service_role のみ
CREATE POLICY "audit_logs_admin_read" ON audit_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'manager')
        )
    );

CREATE POLICY "audit_logs_service_write" ON audit_logs
    FOR INSERT TO service_role
    WITH CHECK (true);

-- ============================================================
-- 2. 予約の二重予約防止 UNIQUE 部分インデックス
--    同一メンター・同一時刻にアクティブな予約は1件のみ
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_no_double_booking
    ON reservations (mentor_id, reserved_at)
    WHERE status != 'cancelled' AND is_blocked = false;

-- ============================================================
-- 3. チェックインの二重実行防止 UNIQUE 部分インデックス
--    同一ユーザー・同一予約に対するチェックインは1件のみ
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_check_in_logs_unique_reservation
    ON check_in_logs (user_id, reservation_id)
    WHERE reservation_id IS NOT NULL;

-- ============================================================
-- 4. user_roles の RLS ポリシー追加
--    ミドルウェアでの認可チェックに必要
--    （anon key でユーザー自身のロールを取得可能にする）
-- ============================================================
-- 既存ポリシーとの競合を避けるため DO NOTHING パターン
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_roles'
        AND policyname = 'user_roles_own_read'
    ) THEN
        EXECUTE 'CREATE POLICY "user_roles_own_read" ON user_roles
            FOR SELECT TO authenticated
            USING (user_id = auth.uid())';
    END IF;
END $$;

-- ============================================================
-- 5. coin_ledgers の期限切れコイン自動処理用インデックス
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_coin_ledgers_active_expiry
    ON coin_ledgers (user_id, status, expires_at)
    WHERE status = 'active';

-- ============================================================
-- 6. reservations の検索効率化インデックス
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_reservations_user_status
    ON reservations (user_id, status, reserved_at)
    WHERE is_blocked = false;

CREATE INDEX IF NOT EXISTS idx_reservations_mentor_date
    ON reservations (mentor_id, reserved_at)
    WHERE status != 'cancelled';
