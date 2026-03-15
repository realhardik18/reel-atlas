-- Run this in your Supabase SQL editor

-- Add ready_to_localize flag to scripts
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS ready_to_localize boolean DEFAULT false;

-- Create script_versions table for version history
CREATE TABLE IF NOT EXISTS script_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id uuid NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  content text NOT NULL,
  version_number integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for fast version lookups
CREATE INDEX IF NOT EXISTS idx_script_versions_script_id ON script_versions(script_id, version_number DESC);
