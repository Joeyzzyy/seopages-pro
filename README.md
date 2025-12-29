# Mini Seenos

一个完整 SEO/GEO Agent 产品的开源浓缩版。基于 Next.js 15 + Vercel AI SDK 构建，包含流式对话、工具调用、技能扩展等核心能力。

**你可以用它来：**
- 直接运行，体验一个完整的 AI Agent 产品
- 修改和扩展，打造自己的 SEO/GEO Agent
- 学习架构，掌握 Agent 开发的核心模式，然后打造其他赛道的 Agent

> 对于零代码基础的人来说，这是掌握"复杂" Agent 项目的良好开端。

## 快速开始

### 方式一：一键部署（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Joeyzzyy/mini-seenos)

1. 点击上方按钮，Fork 并部署到 Vercel
2. 配置环境变量（见下方说明）
3. 初始化数据库（见下方说明）
4. 访问你的应用

### 方式二：本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/Joeyzzyy/mini-seenos.git
cd mini-seenos

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 API Key

# 4. 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 环境变量

创建 `.env.local` 文件（可参考 `.env.example`）：

```env
# Supabase（必需）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# AI 服务（二选一）
# Azure OpenAI
AZURE_OPENAI_API_KEY=xxx
AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com
AZURE_OPENAI_RESOURCE_NAME=xxx
AZURE_OPENAI_DEPLOYMENT=gpt-4

# 或 OpenAI
# OPENAI_API_KEY=sk-xxx

# 可选：网页搜索
TAVILY_API_KEY=tvly-xxx
```

## 数据库初始化

1. 创建 [Supabase](https://supabase.com) 项目
2. 进入 SQL Editor
3. 复制 `supabase/init.sql` 的内容并执行
4. 在 Authentication > URL Configuration 中添加你的应用 URL

## 项目结构

```
mini-agent/
├── app/
│   ├── api/
│   │   ├── chat/           # 聊天 API（流式对话核心）
│   │   └── skills/         # 技能定义
│   │       ├── types.ts    # Skill 接口定义
│   │       ├── index.ts    # Skill 注册中心
│   │       ├── tools/      # 工具实现
│   │       └── skill-*/    # 各类技能
│   ├── build-guide/        # 部署教程页面
│   └── chat/               # 聊天页面
├── components/             # React 组件
├── lib/                    # 工具库
├── supabase/
│   └── init.sql            # 数据库初始化脚本
└── LICENSE                 # MIT 协议
```

## 核心概念

### Skill（技能）

一个 Skill 包含：
- `systemPrompt`: 告诉 AI 如何使用这个技能
- `tools`: 该技能可调用的工具

```typescript
const webResearchSkill: Skill = {
  id: 'web-research',
  name: 'Web Research',
  description: 'Search and analyze information from the web',
  systemPrompt: `You are an expert web researcher...`,
  tools: { web_search },
  enabled: true,
};
```

### Tool（工具）

一个 Tool 包含：
- `description`: 工具描述
- `parameters`: 参数定义（使用 Zod）
- `execute`: 执行函数

```typescript
const web_search = tool({
  description: 'Search the web for information',
  parameters: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    // 实现搜索逻辑
    return { results: [...] };
  },
});
```

## 扩展技能

1. 创建工具文件 `app/api/skills/tools/your-tool.ts`
2. 创建技能文件 `app/api/skills/your.skill.ts`
3. 在 `app/api/skills/index.ts` 中注册

详细教程请访问：`/build-guide`

## 技术栈

- **框架**: Next.js 15 (App Router)
- **AI SDK**: Vercel AI SDK
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **样式**: Tailwind CSS 4
- **语言**: TypeScript

## License

[MIT](./LICENSE) - 可自由使用、修改、商用，无需付费，只需保留版权声明。
