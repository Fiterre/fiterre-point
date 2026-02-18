-- ============================================================
-- Fitest再構築マイグレーション
-- Supabase Dashboard の SQL Editor で実行してください
-- ============================================================

-- fitest_items: テスト項目マスタ
CREATE TABLE IF NOT EXISTS fitest_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    input_type TEXT NOT NULL CHECK (input_type IN ('score', 'weight', 'time', 'distance', 'count')),
    unit TEXT,
    scoring_method TEXT NOT NULL CHECK (scoring_method IN ('higher_better', 'lower_better', 'target_match')),
    max_score INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- fitest_milestone_criteria: マイルストーンの項目別合格基準
CREATE TABLE IF NOT EXISTS fitest_milestone_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    milestone_id UUID NOT NULL REFERENCES fitest_milestones(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES fitest_items(id) ON DELETE CASCADE,
    min_value DECIMAL,
    max_value DECIMAL,
    target_value DECIMAL,
    score_weight INTEGER NOT NULL DEFAULT 100,
    UNIQUE(milestone_id, item_id)
);

-- fitest_result_values: 結果の動的項目値
CREATE TABLE IF NOT EXISTS fitest_result_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id UUID NOT NULL REFERENCES fitest_results(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES fitest_items(id) ON DELETE CASCADE,
    raw_value DECIMAL NOT NULL,
    converted_score DECIMAL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(result_id, item_id)
);

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fitest_items_updated_at
    BEFORE UPDATE ON fitest_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE fitest_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitest_milestone_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitest_result_values ENABLE ROW LEVEL SECURITY;

-- fitest_items: 全認証ユーザーが読み取り可、管理者のみ書き込み
CREATE POLICY "fitest_items_read" ON fitest_items
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "fitest_items_write" ON fitest_items
    FOR ALL TO service_role USING (true);

-- fitest_milestone_criteria: 全認証ユーザーが読み取り可
CREATE POLICY "fitest_milestone_criteria_read" ON fitest_milestone_criteria
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "fitest_milestone_criteria_write" ON fitest_milestone_criteria
    FOR ALL TO service_role USING (true);

-- fitest_result_values: 本人と管理者が読み取り可
CREATE POLICY "fitest_result_values_own_read" ON fitest_result_values
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM fitest_results fr
            WHERE fr.id = result_id AND fr.user_id = auth.uid()
        )
    );

CREATE POLICY "fitest_result_values_write" ON fitest_result_values
    FOR ALL TO service_role USING (true);

-- 既存3項目の初期データ
INSERT INTO fitest_items (name, description, icon, input_type, unit, scoring_method, max_score, display_order)
VALUES
    ('神経衰弱', '脳トレーニング: 神経衰弱ゲームの得点（0〜100点）', 'Brain', 'score', '点', 'higher_better', 100, 1),
    ('Big3合計', 'ベンチプレス・スクワット・デッドリフトの1RM合計重量', 'Dumbbell', 'weight', 'kg', 'higher_better', 100, 2),
    ('体重予測精度', '予測体重と実測体重の誤差（少ないほど高得点）', 'Scale', 'weight', 'kg', 'lower_better', 100, 3)
ON CONFLICT DO NOTHING;
