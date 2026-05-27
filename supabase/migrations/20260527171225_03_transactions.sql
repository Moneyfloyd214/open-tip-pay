/*
  # Open Tip Pay – Transactions

  ## Summary
  Records every payment/tip event. Supports digital, cash, direct deposit,
  and game-phase-aware transactions.

  ## New Tables

  ### `game_phases`
  - id, name ('pre_game' | 'in_game' | 'post_game' | 'halftime'), is_active

  ### `transactions`
  - id (uuid, PK)
  - stand_id (uuid, nullable)
  - staff_id (uuid) – recipient
  - fan_id (uuid, nullable) – sender (null = anonymous guest)
  - transaction_type (text) – 'digital' | 'cash' | 'direct_deposit'
  - amount_cents (int)
  - tip_amount_cents (int) – tip portion only
  - game_phase_id (uuid, nullable)
  - status (text) – 'pending' | 'completed' | 'failed' | 'refunded'
  - stripe_payment_intent_id (text)
  - pos_ticket_id (text) – POS reference
  - tipper_name, tipper_email (text)
  - note (text)
  - created_at

  ## Security
  - Staff see their own transactions
  - Fans see transactions they initiated
  - Managers/admins see all
  - Anon can insert (guest tipping)
*/

-- Game phases
CREATE TABLE IF NOT EXISTS game_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (name IN ('pre_game', 'in_game', 'post_game', 'halftime', 'custom')),
  label text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT false,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE game_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can view game phases"
  ON game_phases FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anon can view active game phases"
  ON game_phases FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Managers can manage game phases"
  ON game_phases FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('manager', 'admin'));

CREATE POLICY "Managers can update game phases"
  ON game_phases FOR UPDATE TO authenticated
  USING (get_my_role() IN ('manager', 'admin'))
  WITH CHECK (get_my_role() IN ('manager', 'admin'));

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stand_id uuid REFERENCES stands(id) ON DELETE SET NULL,
  staff_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fan_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  transaction_type text NOT NULL DEFAULT 'digital'
    CHECK (transaction_type IN ('digital', 'cash', 'direct_deposit')),
  amount_cents integer NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  tip_amount_cents integer NOT NULL DEFAULT 0 CHECK (tip_amount_cents >= 0),
  game_phase_id uuid REFERENCES game_phases(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id text NOT NULL DEFAULT '',
  pos_ticket_id text NOT NULL DEFAULT '',
  tipper_name text NOT NULL DEFAULT 'Anonymous',
  tipper_email text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view own transactions"
  ON transactions FOR SELECT TO authenticated
  USING (staff_id = auth.uid());

CREATE POLICY "Fans can view own transactions"
  ON transactions FOR SELECT TO authenticated
  USING (fan_id = auth.uid());

CREATE POLICY "Managers and admins can view all transactions"
  ON transactions FOR SELECT TO authenticated
  USING (get_my_role() IN ('manager', 'admin'));

CREATE POLICY "Anon can insert transactions (guest tipping)"
  ON transactions FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can insert transactions"
  ON transactions FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Managers can update transactions"
  ON transactions FOR UPDATE TO authenticated
  USING (get_my_role() IN ('manager', 'admin'))
  WITH CHECK (get_my_role() IN ('manager', 'admin'));

CREATE INDEX IF NOT EXISTS transactions_staff_id_idx ON transactions(staff_id);
CREATE INDEX IF NOT EXISTS transactions_fan_id_idx ON transactions(fan_id);
CREATE INDEX IF NOT EXISTS transactions_stand_id_idx ON transactions(stand_id);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS transactions_game_phase_idx ON transactions(game_phase_id);
