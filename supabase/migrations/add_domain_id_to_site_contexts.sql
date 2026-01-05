-- 1. Create seo_projects table
CREATE TABLE IF NOT EXISTS seo_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, domain)
);

ALTER TABLE seo_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own projects" ON seo_projects
  FOR ALL USING (auth.uid() = user_id);

-- 2. Add project_id to site_contexts
ALTER TABLE site_contexts 
  ADD COLUMN project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE;

-- Update the UNIQUE constraint
ALTER TABLE site_contexts
  DROP CONSTRAINT IF EXISTS site_contexts_user_id_type_key;

ALTER TABLE site_contexts
  ADD CONSTRAINT site_contexts_user_id_project_id_type_key 
  UNIQUE(user_id, project_id, type);

CREATE INDEX IF NOT EXISTS idx_site_contexts_project_id ON site_contexts(project_id);

-- 3. Add project_id to conversations
ALTER TABLE conversations 
  ADD COLUMN project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);
