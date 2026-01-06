-- Create project_knowledge table for storing knowledge files metadata
CREATE TABLE IF NOT EXISTS project_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES seo_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- File metadata
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  
  -- Optional metadata
  description TEXT,
  tags TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE project_knowledge ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own project knowledge" ON project_knowledge
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project knowledge" ON project_knowledge
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project knowledge" ON project_knowledge
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own project knowledge" ON project_knowledge
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_knowledge_project_id ON project_knowledge(project_id);
CREATE INDEX IF NOT EXISTS idx_project_knowledge_user_id ON project_knowledge(user_id);
CREATE INDEX IF NOT EXISTS idx_project_knowledge_file_type ON project_knowledge(file_type);

-- Add constraint for max file size (10MB = 10485760 bytes)
ALTER TABLE project_knowledge
  ADD CONSTRAINT project_knowledge_file_size_check
  CHECK (file_size <= 10485760);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_knowledge_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_project_knowledge_updated_at
  BEFORE UPDATE ON project_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION update_project_knowledge_updated_at();

