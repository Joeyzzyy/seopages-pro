-- Add description field to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment to the column
COMMENT ON COLUMN conversations.description IS 'Auto-generated description from first message (first 20 characters)';

