# Creem 支付集成配置指南

本文档介绍如何配置 Creem 支付功能。

## 什么是 Creem？

[Creem](https://creem.io) 是一个为软件公司设计的支付平台，提供：
- **Merchant of Record**（记录商户）- 自动处理全球税务合规
- 简洁的 REST API
- 支持一次性支付和订阅
- 内置客户门户
- 收入分成和联盟营销

## 1. 环境变量配置

在 `.env.local` 文件中添加以下环境变量：

```bash
# ============================================
# Creem Configuration
# ============================================

# Creem API Key (从 Creem Dashboard > Developers 获取)
# 测试模式以 ck_test_ 开头，生产模式以 ck_live_ 开头
CREEM_API_KEY=ck_test_your_api_key_here

# Creem Webhook Secret (从 Webhook 配置页面获取)
CREEM_WEBHOOK_SECRET=your_webhook_secret_here

# Creem Product IDs (从 Creem Dashboard > Products 获取)
# 需要在 Creem 中先创建产品
CREEM_PRODUCT_ID_SINGLE=prod_your_single_product_id
CREEM_PRODUCT_ID_STARTER=prod_your_starter_product_id
CREEM_PRODUCT_ID_STANDARD=prod_your_standard_product_id
CREEM_PRODUCT_ID_PRO=prod_your_pro_product_id
```

## 2. Creem 账户设置

### 2.1 创建账户

1. 访问 [creem.io](https://creem.io) 注册账户
2. 完成邮箱验证和基本设置

### 2.2 获取 API Key

1. 登录 Creem Dashboard
2. 点击顶部导航栏的 "Developers"
3. 点击 "Create API Key"
4. 复制生成的 API Key（以 `ck_test_` 或 `ck_live_` 开头）

### 2.3 创建产品

在 Creem Dashboard 中为每个套餐创建产品：

**Single Page 产品：**
- 名称：Single Page
- 类型：One-time payment
- 价格：$0.50
- 复制 Product ID

**Starter Plan 产品：**
- 名称：Starter Plan
- 类型：One-time payment
- 价格：$4.90
- 复制 Product ID

**Standard Plan 产品：**
- 名称：Standard Plan
- 类型：One-time payment
- 价格：$9.90
- 复制 Product ID

**Pro Plan 产品：**
- 名称：Pro Plan
- 类型：One-time payment
- 价格：$19.90
- 复制 Product ID

### 2.4 配置 Webhook

1. 在 Developers 页面，点击 "Webhooks"
2. 点击 "Add Webhook"
3. 输入 Webhook URL：`https://your-domain.com/api/creem/webhook`
4. 选择以下事件：
   - `checkout.completed` - 结账完成
   - `subscription.active` - 订阅激活（如使用订阅）
   - `subscription.canceled` - 订阅取消
   - `subscription.expired` - 订阅过期
5. 保存后复制 Webhook Secret

## 3. 数据库迁移

运行 SQL 迁移文件创建必要的表：

```bash
# 使用 Supabase CLI
supabase migration up

# 或者直接在 Supabase Dashboard 执行 SQL
# 文件位置: supabase/migrations/add_creem_payment_tables.sql
```

创建的表：
- `creem_checkouts` - 结账会话记录
- `creem_transactions` - 交易记录
- `creem_subscriptions` - 订阅记录（如使用订阅功能）

## 4. 使用 Creem 支付组件

### 4.1 替换现有的 PricingModal

如果你之前使用 PayPal，可以切换到 Creem：

```tsx
// 之前使用 PayPal
import PricingModal from '@/components/PricingModal';

// 切换到 Creem
import PricingModalCreem from '@/components/PricingModalCreem';

// 在组件中使用
<PricingModalCreem
  isOpen={showPricing}
  onClose={() => setShowPricing(false)}
  currentCredits={userCredits}
  currentTier={subscriptionTier}
  onPaymentSuccess={(newCredits, newTier) => {
    setUserCredits(newCredits);
    setSubscriptionTier(newTier);
  }}
/>
```

### 4.2 直接结账模式

```tsx
// 直接打开特定套餐的支付
<PricingModalCreem
  isOpen={true}
  onClose={() => {}}
  currentCredits={0}
  currentTier="free"
  onPaymentSuccess={handleSuccess}
  initialPlan="standard"  // 直接显示 Standard 套餐
  uncloseable={true}      // 用户必须支付才能关闭
/>
```

## 5. 测试支付

### 5.1 测试模式

确保使用测试 API Key（`ck_test_` 开头）：

1. 在 Creem Dashboard 中启用 "Test Mode"
2. 所有交易都是模拟的，不会扣款
3. 使用测试信用卡：
   - 卡号：`4242 4242 4242 4242`
   - 有效期：任意未来日期
   - CVC：任意 3 位数字

### 5.2 本地开发测试

使用 ngrok 暴露本地服务器进行 Webhook 测试：

```bash
# 安装 ngrok
npm install -g ngrok

# 创建隧道
ngrok http 3007

# 使用生成的 URL 更新 Creem Webhook
# 例如: https://abc123.ngrok.io/api/creem/webhook
```

## 6. 生产环境部署

### 6.1 切换到生产模式

1. 在 Creem Dashboard 关闭 "Test Mode"
2. 生成生产 API Key（`ck_live_` 开头）
3. 更新环境变量：
   ```bash
   CREEM_API_KEY=ck_live_your_production_api_key
   CREEM_WEBHOOK_SECRET=your_production_webhook_secret
   ```
4. 更新 Webhook URL 为生产域名

### 6.2 验证配置

部署后验证：
- [ ] API Key 正确配置
- [ ] Webhook Secret 正确配置
- [ ] Product IDs 正确配置
- [ ] Webhook URL 可访问
- [ ] 数据库表已创建

## 7. 定价配置

当前定价方案（可在 `app/api/creem/create-checkout/route.ts` 中修改）：

| 套餐 | 价格 | 积分 | Product ID 环境变量 |
|------|------|------|-------------------|
| Single | $0.50 | 1 | `CREEM_PRODUCT_ID_SINGLE` |
| Starter | $4.90 | 10 | `CREEM_PRODUCT_ID_STARTER` |
| Standard | $9.90 | 20 | `CREEM_PRODUCT_ID_STANDARD` |
| Pro | $19.90 | 50 | `CREEM_PRODUCT_ID_PRO` |

## 8. 与 PayPal 对比

| 特性 | Creem | PayPal |
|------|-------|--------|
| 税务处理 | ✅ 自动（MoR） | ❌ 需自行处理 |
| 全球支付 | ✅ 支持 | ✅ 支持 |
| 客户门户 | ✅ 内置 | ❌ 需自建 |
| 收入分成 | ✅ 支持 | ❌ 不支持 |
| 手续费 | 3.9% + 40¢ | 约 2.9% + 30¢ |
| 集成复杂度 | 简单 | 中等 |

## 9. 故障排除

### 常见问题

**Q: Checkout 创建失败**
- 检查 API Key 是否正确
- 检查 Product ID 是否配置
- 查看服务器日志获取详细错误

**Q: Webhook 未收到**
- 检查 Webhook URL 是否可公开访问
- 检查 Webhook Secret 是否正确
- 在 Creem Dashboard 查看 Webhook 投递状态

**Q: 支付成功后积分未增加**
- 检查 Webhook 是否正确处理
- 查看 `creem_transactions` 表是否有记录
- 检查服务器日志中的 Webhook 处理错误

### 支持渠道

- Creem 文档: https://docs.creem.io
- Creem Discord: https://discord.gg/creem
- Creem 邮件支持: support@creem.io

---

**注意**: Creem 目前处于快速发展阶段，API 可能会有更新。建议定期查看官方文档获取最新信息。
