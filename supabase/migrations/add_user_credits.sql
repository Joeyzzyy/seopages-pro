-- Add credits system to user profiles
-- Run this migration to enable the credits/subscription feature

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  credits INTEGER NOT NULL DEFAULT 1,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'standard', 'pro')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
  subscription_id TEXT,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON public.user_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON public.user_profiles(subscription_status);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile (but not credits/subscription - that's handled by backend)
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, credits)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    1 -- Default 1 credit for new users
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Credit tier configurations
-- Free tier: 1 credit (1 page)
-- Starter ($9.9): 10 credits (10 pages)
-- Standard ($19.9): 20 credits (20 pages)  
-- Pro ($39.9): 50 credits (50 pages)

-- Function to add credits when user purchases a plan
CREATE OR REPLACE FUNCTION public.add_user_credits(
  user_id UUID,
  credits_to_add INTEGER,
  new_tier TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  new_total INTEGER;
BEGIN
  UPDATE public.user_profiles
  SET 
    credits = credits + credits_to_add,
    subscription_tier = COALESCE(new_tier, subscription_tier),
    subscription_status = CASE WHEN new_tier IS NOT NULL THEN 'active' ELSE subscription_status END,
    updated_at = NOW()
  WHERE id = user_id
  RETURNING credits INTO new_total;
  
  RETURN new_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to consume a credit when generating a page
CREATE OR REPLACE FUNCTION public.consume_credit(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT credits INTO current_credits
  FROM public.user_profiles
  WHERE id = user_id;
  
  IF current_credits > 0 THEN
    UPDATE public.user_profiles
    SET credits = credits - 1, updated_at = NOW()
    WHERE id = user_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user credits
CREATE OR REPLACE FUNCTION public.get_user_credits(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_credits INTEGER;
BEGIN
  SELECT credits INTO user_credits
  FROM public.user_profiles
  WHERE id = user_id;
  
  RETURN COALESCE(user_credits, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert profiles for existing users (if any)
INSERT INTO public.user_profiles (id, email, full_name, avatar_url, credits)
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url',
  1
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles WHERE user_profiles.id = users.id
)
ON CONFLICT (id) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE public.user_profiles IS 'User profiles with credits and subscription information';
COMMENT ON COLUMN public.user_profiles.credits IS 'Number of page generation credits remaining. Default 1 for free tier.';
COMMENT ON COLUMN public.user_profiles.subscription_tier IS 'Current subscription tier: free, starter, standard, or pro';
COMMENT ON FUNCTION public.add_user_credits IS 'Add credits to a user account after purchase';
COMMENT ON FUNCTION public.consume_credit IS 'Consume one credit when generating a page. Returns FALSE if no credits available.';
COMMENT ON FUNCTION public.get_user_credits IS 'Get the current credit balance for a user';
