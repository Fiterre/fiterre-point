-- =============================================
-- 003: Exchange System (交換機能)
-- =============================================

-- 交換アイテムマスタ
CREATE TABLE IF NOT EXISTS exchange_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL CHECK (category IN ('discount', 'goods')),
    name TEXT NOT NULL,
    coin_cost INTEGER NOT NULL CHECK (coin_cost > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 交換申請
CREATE TABLE IF NOT EXISTS exchange_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    exchange_item_id UUID NOT NULL REFERENCES exchange_items(id),
    coins_locked INTEGER NOT NULL CHECK (coins_locked > 0),
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'ordering', 'completed', 'cancelled')),
    processed_by UUID REFERENCES auth.users(id),
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_exchange_requests_user_status
    ON exchange_requests (user_id, status);

CREATE INDEX IF NOT EXISTS idx_exchange_requests_status
    ON exchange_requests (status)
    WHERE status IN ('requested', 'ordering');

CREATE INDEX IF NOT EXISTS idx_exchange_requests_item
    ON exchange_requests (exchange_item_id);

CREATE INDEX IF NOT EXISTS idx_exchange_items_active
    ON exchange_items (is_active, display_order)
    WHERE is_active = true;

-- =============================================
-- RLS（Row Level Security）
-- =============================================

-- exchange_items: RLS有効化
ALTER TABLE exchange_items ENABLE ROW LEVEL SECURITY;

-- 認証ユーザーは有効なアイテムを読み取り可
CREATE POLICY "exchange_items_read" ON exchange_items
    FOR SELECT TO authenticated
    USING (is_active = true);

-- service_role のみ書き込み可
CREATE POLICY "exchange_items_service_write" ON exchange_items
    FOR ALL TO service_role
    USING (true);

-- exchange_requests: RLS有効化
ALTER TABLE exchange_requests ENABLE ROW LEVEL SECURITY;

-- 顧客は自分の申請のみ読み取り可
CREATE POLICY "exchange_requests_own_read" ON exchange_requests
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- service_role のみ書き込み可（API経由で操作）
CREATE POLICY "exchange_requests_service_write" ON exchange_requests
    FOR ALL TO service_role
    USING (true);
