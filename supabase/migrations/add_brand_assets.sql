-- Add new fields to site_contexts table for brand assets
-- Run this migration in Supabase SQL Editor

ALTER TABLE site_contexts 
ADD COLUMN IF NOT EXISTS primary_color TEXT,
ADD COLUMN IF NOT EXISTS secondary_color TEXT,
ADD COLUMN IF NOT EXISTS heading_font TEXT,
ADD COLUMN IF NOT EXISTS body_font TEXT,
ADD COLUMN IF NOT EXISTS tone TEXT,
ADD COLUMN IF NOT EXISTS languages TEXT;

