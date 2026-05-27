/*
  # Open Tip Pay – Payouts and Worker Payment Settings

  ## Summary
  Tracks worker payout info and payout history.

  ## New Tables
  - `worker_payment_settings`
    - `id` (uuid, PK)
    - `worker_id` (uuid, unique) – references profiles
    - `stripe_connect_account_id` (text) – Stripe Connect acct
    - `stripe_connect_status` (text) – 'not_connected' | 'pending' | 'active'
    - `payout_schedule` (text) – 'daily' | 'weekly' | 'monthly'
    - `updated_at` (timestamptz)

  - `payouts`
    - `id` (uuid, PK)
    - `worker_id` (uuid)
    - `amount_cents` (int) – total payout amount
    - `status` (text) – 'pending' | 'paid' | 'failed'
    - `stripe_transfer_id` (text)
    - `period_start`, `period_end` (timestamptz)
    - `created_at` (timestamptz)

  ## Security
  - Workers can only view their own records
*/

CREATE TABLE IF NOT EXISTS worker_payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_connect_account_id text NOT NULL DEFAULT '',
  stripe_connect_status text NOT NULL DEFAULT 'not_connected' CHECK (stripe_connect_status IN ('not_connected', 'pending', 'active')),
  payout_schedule text NOT NULL DEFAULT 'weekly' CHECK (payout_schedule IN ('daily', 'weekly', 'monthly')),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE worker_payment_settings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_worker_payment_settings_updated_at
  BEFORE UPDATE ON worker_payment_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Workers can view own payment settings"
  ON worker_payment_settings FOR SELECT
  TO authenticated
  USING (worker_id = auth.uid());

CREATE POLICY "Workers can insert own payment settings"
  ON worker_payment_settings FOR INSERT
  TO authenticated
  WITH CHECK (worker_id = auth.uid());

CREATE POLICY "Workers can update own payment settings"
  ON worker_payment_settings FOR UPDATE
  TO authenticated
  USING (worker_id = auth.uid())
  WITH CHECK (worker_id = auth.uid());

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  stripe_transfer_id text NOT NULL DEFAULT '',
  period_start timestamptz NOT NULL DEFAULT now(),
  period_end timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own payouts"
  ON payouts FOR SELECT
  TO authenticated
  USING (worker_id = auth.uid());

CREATE INDEX IF NOT EXISTS payouts_worker_id_idx ON payouts(worker_id);
CREATE INDEX IF NOT EXISTS payouts_created_at_idx ON payouts(created_at DESC);
