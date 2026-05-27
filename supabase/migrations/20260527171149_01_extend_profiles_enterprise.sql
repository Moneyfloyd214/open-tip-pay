/*
  # Open Tip Pay – Extend Profiles for Enterprise Schema

  ## Summary
  Alters the existing profiles table to support enterprise roles and Stripe Connect.

  ## Changes to `profiles`
  - role enum extended: 'worker' -> 'fan' | 'staff' | 'manager' | 'admin'
  - New columns: stripe_connect_account_id, stripe_connect_status, is_active
  - New RLS policies for manager/admin visibility
  - Helper function get_my_role() for policy use
*/

-- Add new columns if they don't already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='stripe_connect_account_id') THEN
    ALTER TABLE profiles ADD COLUMN stripe_connect_account_id text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='stripe_connect_status') THEN
    ALTER TABLE profiles ADD COLUMN stripe_connect_status text NOT NULL DEFAULT 'not_connected';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_active') THEN
    ALTER TABLE profiles ADD COLUMN is_active boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- Update role check constraint to support all enterprise roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('fan', 'staff', 'manager', 'admin', 'worker', 'employer'));

-- Migrate existing 'worker' -> 'staff', 'employer' -> 'manager'
UPDATE profiles SET role = 'staff' WHERE role = 'worker';
UPDATE profiles SET role = 'manager' WHERE role = 'employer';

-- Final tight constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('fan', 'staff', 'manager', 'admin'));

-- Helper: get calling user's role (used in RLS policies)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop old policies and replace with enterprise ones
DROP POLICY IF EXISTS "Authenticated users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Anon can view profiles for tip pages" ON profiles;
DROP POLICY IF EXISTS "Managers and admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Managers and admins can view all profiles"
  ON profiles FOR SELECT TO authenticated
  USING (get_my_role() IN ('manager', 'admin'));

CREATE POLICY "Anon can view active staff profiles"
  ON profiles FOR SELECT TO anon
  USING (role = 'staff' AND is_active = true);

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS profiles_is_active_idx ON profiles(is_active);
