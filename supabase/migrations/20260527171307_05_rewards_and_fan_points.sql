/*
  # Open Tip Pay – Rewards & Fan Points

  ## Summary
  Fan loyalty system. Fans earn points by tipping.
  Rewards can be redeemed for merchandise, discounts, or experiences.

  ## New Tables

  ### `fan_point_ledger`
  - id (uuid, PK)
  - fan_id (uuid) – references profiles
  - transaction_id (uuid, nullable) – which tip earned these points
  - points (int) – positive = earned, negative = spent
  - event_type (text) – 'earned' | 'redeemed' | 'expired' | 'adjusted'
  - note (text)
  - created_at

  ### `rewards`
  - id (uuid, PK)
  - name (text)
  - description (text)
  - point_cost (int)
  - quantity_available (int) – -1 = unlimited
  - image_url (text)
  - category (text) – 'merchandise' | 'discount' | 'experience' | 'other'
  - is_active (bool)
  - valid_from, valid_until (timestamptz, nullable)
  - created_at

  ### `reward_redemptions`
  - id (uuid, PK)
  - fan_id (uuid)
  - reward_id (uuid)
  - points_spent (int)
  - status (text) – 'pending' | 'fulfilled' | 'cancelled'
  - redeemed_at, fulfilled_at

  ## Security
  - Fans see own ledger + redemptions
  - Admins/managers see all
  - Rewards readable by all authenticated + anon
*/

-- Fan point ledger
CREATE TABLE IF NOT EXISTS fan_point_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  points integer NOT NULL,
  event_type text NOT NULL DEFAULT 'earned'
    CHECK (event_type IN ('earned', 'redeemed', 'expired', 'adjusted')),
  note text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fan_point_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fans can view own point ledger"
  ON fan_point_ledger FOR SELECT TO authenticated
  USING (fan_id = auth.uid());

CREATE POLICY "Managers and admins can view all ledger entries"
  ON fan_point_ledger FOR SELECT TO authenticated
  USING (get_my_role() IN ('manager', 'admin'));

CREATE POLICY "System can insert ledger entries"
  ON fan_point_ledger FOR INSERT TO authenticated
  WITH CHECK (fan_id = auth.uid() OR get_my_role() IN ('manager', 'admin'));

-- Rewards catalog
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  point_cost integer NOT NULL DEFAULT 0 CHECK (point_cost >= 0),
  quantity_available integer NOT NULL DEFAULT -1,
  image_url text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'other'
    CHECK (category IN ('merchandise', 'discount', 'experience', 'other')),
  is_active boolean NOT NULL DEFAULT true,
  valid_from timestamptz,
  valid_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_rewards_updated_at
  BEFORE UPDATE ON rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Anyone can view active rewards"
  ON rewards FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Anon can view active rewards"
  ON rewards FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Admins can manage rewards"
  ON rewards FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('manager', 'admin'));

CREATE POLICY "Admins can update rewards"
  ON rewards FOR UPDATE TO authenticated
  USING (get_my_role() IN ('manager', 'admin'))
  WITH CHECK (get_my_role() IN ('manager', 'admin'));

-- Reward redemptions
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  points_spent integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  redeemed_at timestamptz DEFAULT now(),
  fulfilled_at timestamptz,
  notes text NOT NULL DEFAULT ''
);

ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fans can view own redemptions"
  ON reward_redemptions FOR SELECT TO authenticated
  USING (fan_id = auth.uid());

CREATE POLICY "Managers can view all redemptions"
  ON reward_redemptions FOR SELECT TO authenticated
  USING (get_my_role() IN ('manager', 'admin'));

CREATE POLICY "Fans can redeem rewards"
  ON reward_redemptions FOR INSERT TO authenticated
  WITH CHECK (fan_id = auth.uid());

CREATE POLICY "Managers can update redemptions"
  ON reward_redemptions FOR UPDATE TO authenticated
  USING (get_my_role() IN ('manager', 'admin'))
  WITH CHECK (get_my_role() IN ('manager', 'admin'));

-- Auto-award fan points when a completed tip transaction is inserted
CREATE OR REPLACE FUNCTION award_fan_points()
RETURNS TRIGGER AS $$
BEGIN
  -- 1 point per dollar tipped, only for completed digital transactions with a known fan
  IF NEW.status = 'completed' AND NEW.fan_id IS NOT NULL AND NEW.tip_amount_cents > 0 THEN
    INSERT INTO public.fan_point_ledger (fan_id, transaction_id, points, event_type, note)
    VALUES (
      NEW.fan_id,
      NEW.id,
      GREATEST(1, FLOOR(NEW.tip_amount_cents / 100)),
      'earned',
      'Points earned for tip'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_award_fan_points
  AFTER INSERT ON transactions
  FOR EACH ROW EXECUTE FUNCTION award_fan_points();

-- Convenience view: fan point balances
CREATE OR REPLACE VIEW fan_point_balances AS
  SELECT fan_id, COALESCE(SUM(points), 0) AS balance
  FROM fan_point_ledger
  GROUP BY fan_id;

CREATE INDEX IF NOT EXISTS fan_point_ledger_fan_id_idx ON fan_point_ledger(fan_id);
CREATE INDEX IF NOT EXISTS rewards_is_active_idx ON rewards(is_active);
CREATE INDEX IF NOT EXISTS reward_redemptions_fan_id_idx ON reward_redemptions(fan_id);
