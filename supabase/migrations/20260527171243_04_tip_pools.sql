/*
  # Open Tip Pay – Tip Pools

  ## Summary
  Tip pools aggregate tips from a stand during a game phase.
  POS ticket counts drive pool calculations.
  Staff splits are tracked per pool.

  ## New Tables

  ### `tip_pools`
  - id (uuid, PK)
  - stand_id (uuid) – which stand
  - game_phase_id (uuid, nullable) – which game phase
  - name (text) – display label
  - total_amount_cents (int) – sum of all tips in pool
  - pos_ticket_count (int) – tickets sold during this phase (for weighting)
  - split_method (text) – 'equal' | 'weighted' | 'manual'
  - status (text) – 'open' | 'calculating' | 'distributed' | 'cancelled'
  - created_by (uuid) – manager who opened the pool
  - opened_at, closed_at, distributed_at (timestamptz)

  ### `tip_pool_splits`
  - id (uuid, PK)
  - pool_id (uuid)
  - staff_id (uuid)
  - allocated_amount_cents (int) – calculated share
  - weight (numeric) – for weighted splits
  - status (text) – 'pending' | 'paid' | 'failed'
  - paid_at (timestamptz)

  ## Security
  - Staff see splits that belong to them
  - Managers/admins manage pools
*/

CREATE TABLE IF NOT EXISTS tip_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stand_id uuid NOT NULL REFERENCES stands(id) ON DELETE CASCADE,
  game_phase_id uuid REFERENCES game_phases(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT '',
  total_amount_cents integer NOT NULL DEFAULT 0,
  pos_ticket_count integer NOT NULL DEFAULT 0,
  split_method text NOT NULL DEFAULT 'equal'
    CHECK (split_method IN ('equal', 'weighted', 'manual')),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'calculating', 'distributed', 'cancelled')),
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  distributed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tip_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers and admins can view tip pools"
  ON tip_pools FOR SELECT TO authenticated
  USING (get_my_role() IN ('manager', 'admin'));

CREATE POLICY "Staff can view pools for their stand"
  ON tip_pools FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stand_staff
      WHERE stand_staff.stand_id = tip_pools.stand_id
        AND stand_staff.staff_id = auth.uid()
        AND stand_staff.is_active = true
    )
  );

CREATE POLICY "Managers can create tip pools"
  ON tip_pools FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('manager', 'admin') AND created_by = auth.uid());

CREATE POLICY "Managers can update tip pools"
  ON tip_pools FOR UPDATE TO authenticated
  USING (get_my_role() IN ('manager', 'admin'))
  WITH CHECK (get_my_role() IN ('manager', 'admin'));

-- Tip pool splits (individual staff allocations)
CREATE TABLE IF NOT EXISTS tip_pool_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id uuid NOT NULL REFERENCES tip_pools(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  allocated_amount_cents integer NOT NULL DEFAULT 0,
  weight numeric NOT NULL DEFAULT 1.0,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed')),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (pool_id, staff_id)
);

ALTER TABLE tip_pool_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view own splits"
  ON tip_pool_splits FOR SELECT TO authenticated
  USING (staff_id = auth.uid());

CREATE POLICY "Managers and admins can view all splits"
  ON tip_pool_splits FOR SELECT TO authenticated
  USING (get_my_role() IN ('manager', 'admin'));

CREATE POLICY "Managers can insert splits"
  ON tip_pool_splits FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('manager', 'admin'));

CREATE POLICY "Managers can update splits"
  ON tip_pool_splits FOR UPDATE TO authenticated
  USING (get_my_role() IN ('manager', 'admin'))
  WITH CHECK (get_my_role() IN ('manager', 'admin'));

-- Link transactions to a pool
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'tip_pool_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN tip_pool_id uuid REFERENCES tip_pools(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS tip_pools_stand_id_idx ON tip_pools(stand_id);
CREATE INDEX IF NOT EXISTS tip_pools_status_idx ON tip_pools(status);
CREATE INDEX IF NOT EXISTS tip_pool_splits_staff_id_idx ON tip_pool_splits(staff_id);
CREATE INDEX IF NOT EXISTS tip_pool_splits_pool_id_idx ON tip_pool_splits(pool_id);
