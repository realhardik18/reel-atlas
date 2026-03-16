-- Add share_token to localized_scripts for per-language public sharing
ALTER TABLE localized_scripts ADD COLUMN share_token uuid DEFAULT NULL;

-- Unique partial index: only index non-null tokens for fast lookups
CREATE UNIQUE INDEX idx_localized_scripts_share_token ON localized_scripts(share_token) WHERE share_token IS NOT NULL;
