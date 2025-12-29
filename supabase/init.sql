-- ============================================
-- Mini Agent - 数据库初始化脚本
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 1. 创建 conversations 表
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建 messages 表
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT,
  tool_invocations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建 files 表
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  size INTEGER,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建 content_items 表
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  page_type TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 创建 gsc_integrations 表（Google Search Console）
CREATE TABLE IF NOT EXISTS gsc_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  expiry_date BIGINT,
  authorized_sites TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 启用 RLS（行级安全）
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_integrations ENABLE ROW LEVEL SECURITY;

-- 7. 创建 RLS 策略
CREATE POLICY "Users can access own conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own messages" ON messages
  FOR ALL USING (conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can access own files" ON files
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own content" ON content_items
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own gsc" ON gsc_integrations
  FOR ALL USING (auth.uid() = user_id);

-- 7. 创建 skill_issues 表（问题反馈）
CREATE TABLE IF NOT EXISTS skill_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id TEXT NOT NULL,
  issue_text TEXT,
  image_urls TEXT[],
  is_resolved BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending_review', -- pending_review, unresolved, resolved
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- skill_issues 不需要 RLS，因为是全局共享的

-- 8. 创建 user_domains 表（用户绑定的域名）
CREATE TABLE IF NOT EXISTS user_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  verification_type TEXT DEFAULT 'txt', -- 'txt' or 'cname'
  verification_token TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, domain)
);

-- 9. 创建 domain_subdirectories 表（域名下的子目录）
CREATE TABLE IF NOT EXISTS domain_subdirectories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES user_domains(id) ON DELETE CASCADE,
  path TEXT NOT NULL, -- e.g., '/blog', '/resources'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(domain_id, path)
);

-- 启用 RLS
ALTER TABLE user_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_subdirectories ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "Users can access own domains" ON user_domains
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own subdirectories" ON domain_subdirectories
  FOR ALL USING (domain_id IN (
    SELECT id FROM user_domains WHERE user_id = auth.uid()
  ));

-- ============================================
-- 初始化完成
-- ============================================

