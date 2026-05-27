/*
  # Extend Schema: Hours Worked & Volunteer Org Revenue Routing

  1. Changes to `check_ins`
     - Add `hours_worked` (numeric) — computed or manually set hours for weighted tip split calculations

  2. Changes to `tip_pool_splits`
     - Add `hours_worked` (numeric) — hours contributed during this pool period
     - Add `role_weight` (numeric) — multiplier by role (e.g. bartender=1.5, cashier=1.0)

  3. Changes to `transactions`
     - Add `volunteer_org_id` (uuid, FK → volunteer_organizations) — auto-populated when stand is flagged as volunteer

  4. Changes to `stands`
     - Add `is_volunteer_org` (boolean) — flag that triggers automatic org revenue routing
*/

-- 1. Add hours_worked to check_ins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'check_ins' AND column_name = 'hours_worked'
  ) THEN
    ALTER TABLE check_ins ADD COLUMN hours_worked numeric DEFAULT 0;
  END IF;
END $$;

-- 2. Add hours_worked + role_weight to tip_pool_splits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tip_pool_splits' AND column_name = 'hours_worked'
  ) THEN
    ALTER TABLE tip_pool_splits ADD COLUMN hours_worked numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tip_pool_splits' AND column_name = 'role_weight'
  ) THEN
    ALTER TABLE tip_pool_splits ADD COLUMN role_weight numeric DEFAULT 1.0;
  END IF;
END $$;

-- 3. Add volunteer_org_id to transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'volunteer_org_id'
  ) THEN
    ALTER TABLE transactions
      ADD COLUMN volunteer_org_id uuid REFERENCES volunteer_organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Add is_volunteer_org flag to stands
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stands' AND column_name = 'is_volunteer_org'
  ) THEN
    ALTER TABLE stands ADD COLUMN is_volunteer_org boolean DEFAULT false;
  END IF;
END $$;

-- Index for volunteer org lookups on transactions
CREATE INDEX IF NOT EXISTS idx_transactions_volunteer_org ON transactions(volunteer_org_id) WHERE volunteer_org_id IS NOT NULL;
