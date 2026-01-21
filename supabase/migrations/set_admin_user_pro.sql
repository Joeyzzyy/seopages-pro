-- Set zhuyuejoey@gmail.com to Pro tier (highest tier)
-- This script should be run AFTER add_user_credits.sql

-- First, ensure the user profile exists
INSERT INTO public.user_profiles (id, email, credits, subscription_tier, subscription_status)
SELECT 
  id,
  email,
  50, -- Pro tier credits
  'pro',
  'active'
FROM auth.users
WHERE email = 'zhuyuejoey@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  credits = 50,
  subscription_tier = 'pro',
  subscription_status = 'active',
  updated_at = NOW();

-- Verify the update
SELECT 
  up.id,
  up.email,
  up.credits,
  up.subscription_tier,
  up.subscription_status,
  up.updated_at
FROM public.user_profiles up
JOIN auth.users u ON u.id = up.id
WHERE u.email = 'zhuyuejoey@gmail.com';
