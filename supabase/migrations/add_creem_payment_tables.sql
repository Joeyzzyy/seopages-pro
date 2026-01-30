-- ============================================
-- Creem 支付集成数据库迁移
-- ============================================

-- 1. 创建 Creem Checkout 表 - 记录结账会话
CREATE TABLE IF NOT EXISTS public.creem_checkouts (
  id TEXT PRIMARY KEY, -- Creem Checkout ID
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('standard', 'pro')),
  product_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  credits INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
  order_id TEXT,
  checkout_url TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_creem_checkouts_user_id ON public.creem_checkouts(user_id);
CREATE INDEX IF NOT EXISTS idx_creem_checkouts_status ON public.creem_checkouts(status);
CREATE INDEX IF NOT EXISTS idx_creem_checkouts_order_id ON public.creem_checkouts(order_id);
CREATE INDEX IF NOT EXISTS idx_creem_checkouts_created_at ON public.creem_checkouts(created_at DESC);

-- 启用 RLS
ALTER TABLE public.creem_checkouts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own checkouts
CREATE POLICY "Users can view own checkouts" ON public.creem_checkouts
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================

-- 2. 创建 Creem Transactions 表 - 记录交易记录
CREATE TABLE IF NOT EXISTS public.creem_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_id TEXT REFERENCES public.creem_checkouts(id),
  order_id TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('standard', 'pro')),
  product_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  credits_added INTEGER NOT NULL,
  customer_email TEXT,
  status TEXT NOT NULL CHECK (status IN ('completed', 'refunded', 'failed')),
  refunded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_creem_transactions_user_id ON public.creem_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_creem_transactions_checkout_id ON public.creem_transactions(checkout_id);
CREATE INDEX IF NOT EXISTS idx_creem_transactions_order_id ON public.creem_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_creem_transactions_created_at ON public.creem_transactions(created_at DESC);

-- 启用 RLS
ALTER TABLE public.creem_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON public.creem_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================

-- 3. 创建 Creem Subscriptions 表 - 记录订阅信息（如果使用订阅功能）
CREATE TABLE IF NOT EXISTS public.creem_subscriptions (
  id TEXT PRIMARY KEY, -- Creem Subscription ID
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  product_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'canceled', 'expired', 'paused')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  customer_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_creem_subscriptions_user_id ON public.creem_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_creem_subscriptions_status ON public.creem_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_creem_subscriptions_created_at ON public.creem_subscriptions(created_at DESC);

-- 启用 RLS
ALTER TABLE public.creem_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.creem_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================

-- 4. 创建自动更新 updated_at 的触发器函数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为各表添加触发器
DROP TRIGGER IF EXISTS update_creem_checkouts_updated_at ON public.creem_checkouts;
CREATE TRIGGER update_creem_checkouts_updated_at
  BEFORE UPDATE ON public.creem_checkouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_creem_subscriptions_updated_at ON public.creem_subscriptions;
CREATE TRIGGER update_creem_subscriptions_updated_at
  BEFORE UPDATE ON public.creem_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================

-- 5. 添加注释
COMMENT ON TABLE public.creem_checkouts IS 'Creem 结账会话记录表';
COMMENT ON TABLE public.creem_transactions IS 'Creem 交易记录表';
COMMENT ON TABLE public.creem_subscriptions IS 'Creem 订阅记录表';

COMMENT ON COLUMN public.creem_checkouts.id IS 'Creem Checkout ID';
COMMENT ON COLUMN public.creem_checkouts.plan IS '购买的套餐: single, starter, standard, pro';
COMMENT ON COLUMN public.creem_checkouts.status IS '结账状态: pending, completed, expired, cancelled';
COMMENT ON COLUMN public.creem_checkouts.order_id IS 'Creem Order ID，支付成功后生成';

COMMENT ON COLUMN public.creem_transactions.credits_added IS '本次交易添加的积分数量';
COMMENT ON COLUMN public.creem_transactions.status IS '交易状态: completed, refunded, failed';

-- ============================================

-- 6. 可选：创建视图用于用户支付历史汇总
CREATE OR REPLACE VIEW public.user_payment_summary AS
SELECT 
  user_id,
  COUNT(DISTINCT ct.id) as total_transactions,
  COALESCE(SUM(ct.credits_added), 0) as total_credits_purchased,
  COALESCE(SUM(ct.amount), 0) as total_amount_spent,
  MAX(ct.created_at) as last_payment_date
FROM public.creem_transactions ct
WHERE ct.status = 'completed'
GROUP BY user_id;

-- 启用视图的 RLS（通过底层表）
ALTER VIEW public.user_payment_summary OWNER TO postgres;

-- ============================================
-- 迁移完成
-- ============================================
