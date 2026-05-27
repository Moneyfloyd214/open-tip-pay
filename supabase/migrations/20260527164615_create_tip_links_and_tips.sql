/*
  # Open Tip Pay – Tip Links and Tips Tables

  ## Summary
  Core tipping functionality. Each worker gets a shareable tip link.
  Guests use the link to send tips without needing an account.

  ## New Tables
  - `tip_links`
    - `id` (uuid, PK)
    - `worker_id` (uuid) – references profiles
    - `slug` (text, unique) – URL path e.g. /tip/john-doe
    - `title` (text) – e.g. "Tip John"
    - `message` (text) – custom thank-you message
    - `is_active` (bool)
    - `org_id` (uuid, nullable) – optional org association
    - `created_at` (timestamptz)

  - `tips`
    - `id` (uuid, PK)
    - `tip_link_id` (uuid) – which tip link was used
    - `worker_id` (uuid) – recipient
    - `tipper_name` (text) – guest name
    - `tipper_email` (text) – guest email (optional)
    - `amount_cents` (int) – amount in cents
    - `message` (text) – optional note from tipper
    - `status` (text) – 'pending' | 'completed' | 'failed' | 'refunded'
    - `stripe_payment_intent_id` (text)
    - `created_at` (timestamptz)

  ## Security
  - Workers can view their own tip links and tips
  - Anon can view tip links to render tip pages
  - Anon can INSERT tips (guest tipping)
*/

CREATE TABLE IF NOT EXISTS tip_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  slug text UNIQUE NOT NULL,
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tip_links ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_tip_links_updated_at
  BEFORE UPDATE ON tip_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Workers can view own tip links"
  ON tip_links FOR SELECT
  TO authenticated
  USING (worker_id = auth.uid());

CREATE POLICY "Anon can view active tip links"
  ON tip_links FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Workers can insert own tip links"
  ON tip_links FOR INSERT
  TO authenticated
  WITH CHECK (worker_id = auth.uid());

CREATE POLICY "Workers can update own tip links"
  ON tip_links FOR UPDATE
  TO authenticated
  USING (worker_id = auth.uid())
  WITH CHECK (worker_id = auth.uid());

CREATE POLICY "Workers can delete own tip links"
  ON tip_links FOR DELETE
  TO authenticated
  USING (worker_id = auth.uid());

-- Tips table
CREATE TABLE IF NOT EXISTS tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_link_id uuid NOT NULL REFERENCES tip_links(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipper_name text NOT NULL DEFAULT 'Anonymous',
  tipper_email text NOT NULL DEFAULT '',
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view tips they received"
  ON tips FOR SELECT
  TO authenticated
  USING (worker_id = auth.uid());

CREATE POLICY "Anon can insert tips"
  ON tips FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert tips"
  ON tips FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS tips_worker_id_idx ON tips(worker_id);
CREATE INDEX IF NOT EXISTS tips_created_at_idx ON tips(created_at DESC);
CREATE INDEX IF NOT EXISTS tip_links_slug_idx ON tip_links(slug);
CREATE INDEX IF NOT EXISTS tip_links_worker_id_idx ON tip_links(worker_id);
