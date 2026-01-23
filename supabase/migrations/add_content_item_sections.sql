-- Create content_item_sections table for storing generated sections
-- This enables incremental page building to avoid token limits

CREATE TABLE IF NOT EXISTS content_item_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,           -- e.g., "hero", "product-card-1", "faq"
  section_type TEXT NOT NULL,         -- e.g., "hero", "comparison_table", "product_card", "faq", "cta"
  section_order INT NOT NULL,         -- Order for assembling (0, 1, 2, ...)
  section_html TEXT NOT NULL,         -- The actual HTML content
  metadata JSONB DEFAULT '{}',        -- Optional metadata (title, description, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique section per content item
  UNIQUE(content_item_id, section_id)
);

-- Index for fast lookup by content_item_id
CREATE INDEX IF NOT EXISTS idx_content_item_sections_content_item_id 
  ON content_item_sections(content_item_id);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_content_item_sections_order 
  ON content_item_sections(content_item_id, section_order);

-- Enable RLS
ALTER TABLE content_item_sections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read/write sections for their own content items
CREATE POLICY "Users can manage their own sections" ON content_item_sections
  FOR ALL
  USING (
    content_item_id IN (
      SELECT id FROM content_items WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    content_item_id IN (
      SELECT id FROM content_items WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role has full access
CREATE POLICY "Service role has full access" ON content_item_sections
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Comment
COMMENT ON TABLE content_item_sections IS 'Stores generated HTML sections for incremental page building';
