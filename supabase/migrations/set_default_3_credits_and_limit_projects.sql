-- Give new users 3 free credits and limit projects to 3 per user
-- This allows free users to try the product without paying

-- Update the table default to 3 credits
ALTER TABLE public.user_profiles 
ALTER COLUMN credits SET DEFAULT 3;

-- Update the trigger function to give 3 credits by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, credits)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    3 -- Default 3 credits for new users (free trial)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comment
COMMENT ON COLUMN public.user_profiles.credits IS 'Number of page generation credits remaining. Default 3 for new users (free trial).';

-- Add max_projects column to user_profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'max_projects'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN max_projects INTEGER NOT NULL DEFAULT 3;
    COMMENT ON COLUMN public.user_profiles.max_projects IS 'Maximum number of projects a user can create. Default 3 for all users.';
  END IF;
END $$;

-- Function to check if user can create a new project
CREATE OR REPLACE FUNCTION public.can_create_project(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get max projects allowed (default 3)
  SELECT COALESCE(max_projects, 3) INTO max_allowed
  FROM public.user_profiles
  WHERE id = user_id;
  
  -- If no profile found, use default 3
  IF max_allowed IS NULL THEN
    max_allowed := 3;
  END IF;
  
  -- Count current projects
  SELECT COUNT(*) INTO current_count
  FROM public.seo_projects
  WHERE seo_projects.user_id = can_create_project.user_id;
  
  RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.can_create_project IS 'Check if user can create a new project (max 3 projects per user)';
