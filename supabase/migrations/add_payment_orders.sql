-- 创建支付订单表，用于记录所有支付交易
-- 这是可选的，但建议使用以便追踪和对账

CREATE TABLE IF NOT EXISTS public.payment_orders (
  id TEXT PRIMARY KEY, -- PayPal Order ID
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('standard', 'pro')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  credits INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'APPROVED', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED')),
  provider TEXT NOT NULL DEFAULT 'paypal',
  paypal_capture_id TEXT,
  error_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON public.payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON public.payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON public.payment_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_orders_paypal_capture_id ON public.payment_orders(paypal_capture_id);

-- Enable RLS
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.payment_orders
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Only backend can insert/update (via service role)
-- No policy for INSERT/UPDATE means only service role can do it

-- Trigger to auto-update updated_at
CREATE TRIGGER update_payment_orders_updated_at
  BEFORE UPDATE ON public.payment_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 添加注释
COMMENT ON TABLE public.payment_orders IS '支付订单记录表，用于追踪所有 PayPal 交易';
COMMENT ON COLUMN public.payment_orders.id IS 'PayPal Order ID';
COMMENT ON COLUMN public.payment_orders.plan IS '购买的订阅计划: starter, standard, pro';
COMMENT ON COLUMN public.payment_orders.status IS '订单状态: CREATED, APPROVED, COMPLETED, FAILED, REFUNDED, CANCELLED';
COMMENT ON COLUMN public.payment_orders.paypal_capture_id IS 'PayPal 支付捕获 ID，用于退款等操作';
