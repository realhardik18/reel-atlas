CREATE TABLE localized_scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  market_code TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(script_id, locale)
);

CREATE INDEX idx_localized_scripts_script ON localized_scripts(script_id);

ALTER TABLE localized_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own localized scripts"
  ON localized_scripts
  FOR ALL
  USING (user_id = current_setting('request.jwt.claims')::json->>'sub');
