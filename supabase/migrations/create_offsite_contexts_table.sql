-- Create offsite_contexts table for storing offsite brand presence data
CREATE TABLE IF NOT EXISTS offsite_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE NOT NULL,
  
  -- Monitoring Scope
  brand_keywords JSONB DEFAULT '[]'::jsonb,
  product_keywords JSONB DEFAULT '[]'::jsonb,
  key_persons JSONB DEFAULT '[]'::jsonb,
  hashtags JSONB DEFAULT '[]'::jsonb,
  required_keywords JSONB DEFAULT '[]'::jsonb,
  excluded_keywords JSONB DEFAULT '[]'::jsonb,
  regions JSONB DEFAULT '[]'::jsonb,
  languages JSONB DEFAULT '[]'::jsonb,
  
  -- Owned Presence
  official_channels JSONB DEFAULT '[]'::jsonb,
  executive_accounts JSONB DEFAULT '[]'::jsonb,
  
  -- Reviews & Listings
  review_platforms JSONB DEFAULT '[]'::jsonb,
  directories JSONB DEFAULT '[]'::jsonb,
  storefronts JSONB DEFAULT '[]'::jsonb,
  
  -- Community
  forums JSONB DEFAULT '[]'::jsonb,
  qa_platforms JSONB DEFAULT '[]'::jsonb,
  branded_groups JSONB DEFAULT '[]'::jsonb,
  
  -- Media
  media_channels JSONB DEFAULT '[]'::jsonb,
  coverage JSONB DEFAULT '[]'::jsonb,
  events JSONB DEFAULT '[]'::jsonb,
  
  -- KOLs
  creators JSONB DEFAULT '[]'::jsonb,
  experts JSONB DEFAULT '[]'::jsonb,
  press_contacts JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint for upsert
  CONSTRAINT unique_user_project_offsite UNIQUE (user_id, project_id)
);

-- Enable Row Level Security
ALTER TABLE offsite_contexts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own offsite contexts"
  ON offsite_contexts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own offsite contexts"
  ON offsite_contexts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own offsite contexts"
  ON offsite_contexts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own offsite contexts"
  ON offsite_contexts FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_offsite_contexts_user_id ON offsite_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_offsite_contexts_project_id ON offsite_contexts(project_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_offsite_contexts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_offsite_contexts_updated_at
  BEFORE UPDATE ON offsite_contexts
  FOR EACH ROW
  EXECUTE FUNCTION update_offsite_contexts_updated_at();
