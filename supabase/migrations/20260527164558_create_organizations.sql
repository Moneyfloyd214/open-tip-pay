/*
  # Open Tip Pay – Organizations and Members Tables

  ## Summary
  Businesses/employers can create an organization and invite workers.

  ## New Tables
  - `organizations`: business accounts with owner, name, logo, slug
  - `organization_members`: links workers to organizations with a role

  ## Security
  - RLS enabled on both tables
  - Owners and members can view their org
  - Only owners can manage membership
*/

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  logo_url text NOT NULL DEFAULT '',
  slug text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'worker' CHECK (role IN ('manager', 'worker')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE (org_id, user_id)
);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Org owners can view their org"
  ON organizations FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Org members can view their org"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = organizations.id
        AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Anon can view orgs for tip pages"
  ON organizations FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Owners can insert org"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update org"
  ON organizations FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Organization members policies
CREATE POLICY "Members can view own membership"
  ON organization_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Org owners can view all members"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = organization_members.org_id
        AND organizations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Org owners can add members"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = org_id
        AND organizations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Org owners can remove members"
  ON organization_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = organization_members.org_id
        AND organizations.owner_id = auth.uid()
    )
  );
