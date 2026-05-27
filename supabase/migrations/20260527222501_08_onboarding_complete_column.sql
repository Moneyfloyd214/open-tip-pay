/*
  # Add onboarding_complete to profiles

  1. Changes
    - Adds `onboarding_complete` boolean column to `profiles` table (default false)
    - This column tracks whether a user has completed the 5-screen Colts Tip Pay onboarding slideshow
    - Existing rows default to false; users will be prompted to complete onboarding on next login

  2. Security
    - No new RLS policies needed; column is covered by existing `profiles` policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_complete'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_complete boolean DEFAULT false;
  END IF;
END $$;
