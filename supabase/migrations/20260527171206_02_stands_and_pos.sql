/*
  # Open Tip Pay – Stands & POS Integration

  ## Summary
  Models physical concession/service stands and their POS system type.
  Volunteer organizations can be linked to stands.

  ## New Tables

  ### `volunteer_organizations`
  - id, name, contact_email, contact_phone, is_active

  ### `stands`
  - id (uuid, PK)
  - org_id (uuid) – owning organization/venue
  - name (text) – "Stand 14 – Hot Dogs"
  - location (text) – section/gate descriptor
  - pos_type (text) – 'square' | 'clover' | 'toast' | 'manual' | 'other'
  - volunteer_org_id (uuid, nullable) – linked volunteer org
  - is_active (bool)
  - created_at, updated_at

  ## Security
  - Staff can view stands in their org
  - Managers/admins can manage stands
*/

-- Volunteer organizations
CREATE TABLE IF NOT EXISTS volunteer_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE volunteer_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view volunteer orgs"
  ON volunteer_organizations FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert volunteer orgs"
  ON volunteer_organizations FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('manager', 'admin'));

CREATE POLICY "Admins can update volunteer orgs"
  ON volunteer_organizations FOR UPDATE TO authenticated
  USING (get_my_role() IN ('manager', 'admin'))
  WITH CHECK (get_my_role() IN ('manager', 'admin'));

-- Stands
CREATE TABLE IF NOT EXISTS stands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  pos_type text NOT NULL DEFAULT 'manual' CHECK (pos_type IN ('square', 'clover', 'toast', 'manual', 'other')),
  volunteer_org_id uuid REFERENCES volunteer_organizations(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE stands ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_stands_updated_at
  BEFORE UPDATE ON stands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "All authenticated can view active stands"
  ON stands FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Anon can view active stands"
  ON stands FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "Managers and admins can insert stands"
  ON stands FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('manager', 'admin'));

CREATE POLICY "Managers and admins can update stands"
  ON stands FOR UPDATE TO authenticated
  USING (get_my_role() IN ('manager', 'admin'))
  WITH CHECK (get_my_role() IN ('manager', 'admin'));

-- Staff-to-stand assignments
CREATE TABLE IF NOT EXISTS stand_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stand_id uuid NOT NULL REFERENCES stands(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (stand_id, staff_id)
);

ALTER TABLE stand_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view own assignments"
  ON stand_staff FOR SELECT TO authenticated
  USING (staff_id = auth.uid());

CREATE POLICY "Managers can view all stand assignments"
  ON stand_staff FOR SELECT TO authenticated
  USING (get_my_role() IN ('manager', 'admin'));

CREATE POLICY "Managers can assign staff"
  ON stand_staff FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('manager', 'admin'));

CREATE POLICY "Managers can update staff assignments"
  ON stand_staff FOR UPDATE TO authenticated
  USING (get_my_role() IN ('manager', 'admin'))
  WITH CHECK (get_my_role() IN ('manager', 'admin'));

CREATE INDEX IF NOT EXISTS stand_staff_staff_id_idx ON stand_staff(staff_id);
CREATE INDEX IF NOT EXISTS stand_staff_stand_id_idx ON stand_staff(stand_id);
