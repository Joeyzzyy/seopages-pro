-- Add published_domain and published_path fields to content_items table
-- These fields store where the content is published

ALTER TABLE content_items 
ADD COLUMN IF NOT EXISTS published_domain TEXT,
ADD COLUMN IF NOT EXISTS published_path TEXT DEFAULT '';

-- Create an index for faster lookups when checking for slug conflicts
CREATE INDEX IF NOT EXISTS idx_content_items_published_location 
ON content_items (published_domain, published_path, slug) 
WHERE status = 'published';

-- Add a comment for documentation
COMMENT ON COLUMN content_items.published_domain IS 'The domain where this content is published (e.g., example.com)';
COMMENT ON COLUMN content_items.published_path IS 'The subdirectory path where this content is published (e.g., /blog)';

