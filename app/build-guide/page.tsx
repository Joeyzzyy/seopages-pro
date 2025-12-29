'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Icon components
const Icons = {
  check: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  warning: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  copy: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  terminal: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  ),
  code: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  tools: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  list: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  target: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  chevron: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  arrow: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
};

// Product Introduction Data
const productInfo = {
  name: 'Mini Agent',
  subtitle: 'SEO/GEO Agent 浓缩版',
  intro: '这是一个完整 SEO/GEO Agent 产品的个人浓缩版，所有代码完全开源。基于 Next.js 15 + Vercel AI SDK 构建，包含流式对话、工具调用、技能扩展等核心能力。你可以直接使用它打造自己的 SEO/GEO Agent，也可以按照项目指引，打造其他功能或赛道的 Agent。对于零代码基础的人来说，这是掌握"复杂" Agent 项目的良好开端。',
  painPoints: [
    {
      title: '复杂 Agent 项目难以入门',
      desc: '市面上的 AI Agent 项目代码复杂、文档不全，零基础用户看不懂架构，不知道从哪里开始学习和修改。',
    },
    {
      title: '缺乏可运行的完整案例',
      desc: '很多教程只讲概念不给代码，或者代码片段无法直接运行。想要一个能跑起来、能改、能学的完整项目很难找到。',
    },
    {
      title: '从学习到实战的鸿沟',
      desc: '学了 API 调用、Prompt 工程，但不知道如何组织成一个完整产品。缺乏从零到一打造 Agent 产品的系统指引。',
    },
  ],
  targetUsers: '零代码基础的 AI 爱好者、想入门 Agent 开发的产品经理、独立开发者、SEO/内容营销从业者。无论是想打造自己的 SEO/GEO Agent，还是探索其他赛道的 AI Agent 应用，这个项目都是理想的起点。',
  efficiency: [
    {
      title: '快速跑通完整项目',
      desc: 'Fork 仓库、配置 API Key、部署到 Vercel。按照教程操作，即可拥有一个可运行的 Agent 应用。',
    },
    {
      title: '边用边学，理解架构',
      desc: '项目结构清晰，Skill + Tool 模式一目了然。通过修改和扩展功能，在实践中理解 Agent 开发的核心逻辑。',
    },
    {
      title: '可复制的项目模式',
      desc: '这是一个真实 SEO/GEO Agent 产品的浓缩版。理解这个项目后，可以尝试打造其他赛道的 Agent 产品。',
    },
  ],
  effects: [
    '零基础也能掌握复杂 Agent 项目的核心架构和开发模式',
    '完整开源代码，可直接运行、修改、二次开发',
    '可快速复刻为 SEO/GEO Agent，或改造为任意赛道的 Agent',
    '从项目中学习 Skill 定义、Tool 调用、流式对话等核心能力',
  ],
};

export default function BuildGuidePage() {
  const brandGradient = 'linear-gradient(80deg, #FFAF40, #D194EC, #9A8FEA, #65B4FF)';
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [mode, setMode] = useState<'quick' | 'scratch'>('quick');
  const [activeQuickStep, setActiveQuickStep] = useState<number | null>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const quickStepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const scrollToStep = (idx: number) => {
    setActiveStep(idx);
    setTimeout(() => {
      stepRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const scrollToQuickStep = (idx: number) => {
    setActiveQuickStep(idx);
    setTimeout(() => {
      quickStepRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Quick Deploy Steps
  const quickSteps = [
    {
      step: '01',
      titleEn: 'Fork Repository',
      titleCn: 'Fork 仓库',
      descEn: 'Fork the project to your GitHub account.',
      descCn: '将项目 Fork 到你的 GitHub 账号。',
      tools: ['Browser', 'GitHub'],
      actions: [
        {
          action: '访问项目仓库',
          tool: 'Browser',
          command: 'https://github.com/Joeyzzyy/mini-seenos',
          expected: '看到项目主页',
        },
        {
          action: '点击右上角 Fork 按钮',
          tool: 'GitHub',
          expected: '仓库复制到你的账号下',
        },
      ],
      code: `# 或者使用 Git 命令行克隆（本地开发用）

git clone https://github.com/Joeyzzyy/mini-seenos.git
cd mini-seenos
npm install`,
      successCheck: '你的 GitHub 账号下出现 mini-agent 仓库',
    },
    {
      step: '02',
      titleEn: 'Create Supabase Project',
      titleCn: '创建 Supabase 项目',
      descEn: 'Set up a free Supabase project for database and authentication.',
      descCn: '创建免费的 Supabase 项目，用于数据库和用户认证。',
      tools: ['Browser', 'Supabase'],
      actions: [
        {
          action: '访问 Supabase 并登录',
          tool: 'Browser',
          command: 'https://supabase.com/dashboard',
          expected: '进入 Supabase Dashboard',
        },
        {
          action: '创建新项目',
          tool: 'Supabase Dashboard',
          expected: '点击 "New Project"，填写项目名称和数据库密码',
        },
        {
          action: '等待项目创建完成',
          tool: 'Supabase',
          expected: '约 1-2 分钟后项目就绪',
        },
      ],
      code: `# 项目创建后，进入 Settings > API 获取以下信息：

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # 在 Service Role 区域

# 保存这些值，后面部署时需要用到`,
      successCheck: '记录下 URL、Anon Key 和 Service Role Key',
    },
    {
      step: '03',
      titleEn: 'Run Database Migrations',
      titleCn: '运行数据库迁移',
      descEn: 'Execute SQL migrations to create required tables.',
      descCn: '执行 SQL 迁移脚本，创建所需的数据库表。',
      tools: ['Supabase SQL Editor'],
      actions: [
        {
          action: '打开 SQL Editor',
          tool: 'Supabase Dashboard',
          expected: '左侧菜单点击 SQL Editor',
        },
        {
          action: '复制并运行迁移 SQL',
          tool: 'SQL Editor',
          expected: '依次运行下方的 SQL 脚本',
        },
      ],
      code: `-- 1. 创建 conversations 表
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

-- 6. 启用 RLS
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
  FOR ALL USING (auth.uid() = user_id);`,
      successCheck: 'SQL 执行成功，无报错',
      warning: '每段 SQL 可以分开执行，确保无报错后再执行下一段',
    },
    {
      step: '04',
      titleEn: 'Get AI API Keys',
      titleCn: '获取 AI API Key',
      descEn: 'Get API keys from Azure OpenAI or OpenAI.',
      descCn: '从 Azure OpenAI 或 OpenAI 获取 API Key。',
      tools: ['Browser'],
      actions: [
        {
          action: '选择 AI 服务提供商',
          tool: 'Browser',
          expected: '推荐 Azure OpenAI（企业）或 OpenAI（个人）',
        },
        {
          action: 'Azure: 访问 Azure Portal',
          tool: 'Browser',
          command: 'https://portal.azure.com',
          expected: '创建 Azure OpenAI 资源，部署 GPT-4 模型',
        },
        {
          action: 'OpenAI: 访问 OpenAI Platform',
          tool: 'Browser',
          command: 'https://platform.openai.com/api-keys',
          expected: '创建新的 API Key',
        },
      ],
      code: `# Azure OpenAI 需要的环境变量：
AZURE_OPENAI_API_KEY=your_azure_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_RESOURCE_NAME=your-resource-name
AZURE_OPENAI_DEPLOYMENT=gpt-4

# 或者 OpenAI 需要的环境变量：
OPENAI_API_KEY=sk-your_openai_key

# 可选：Tavily Web Search API（免费额度）
# 注册：https://tavily.com
TAVILY_API_KEY=tvly-your_key`,
      successCheck: '记录下所有 API Key，部署时使用',
    },
    {
      step: '05',
      titleEn: 'Deploy to Vercel',
      titleCn: '部署到 Vercel',
      descEn: 'One-click deploy to Vercel with environment variables.',
      descCn: '一键部署到 Vercel，配置环境变量。',
      tools: ['Browser', 'Vercel'],
      actions: [
        {
          action: '访问 Vercel 并登录',
          tool: 'Browser',
          command: 'https://vercel.com/new',
          expected: '使用 GitHub 账号登录',
        },
        {
          action: 'Import Git Repository',
          tool: 'Vercel',
          expected: '选择你 Fork 的 mini-agent 仓库',
        },
        {
          action: '配置环境变量',
          tool: 'Vercel',
          expected: '展开 Environment Variables，添加所有 Key',
        },
        {
          action: '点击 Deploy',
          tool: 'Vercel',
          expected: '等待 2-3 分钟部署完成',
        },
      ],
      code: `# Vercel 需要配置的环境变量清单：

# === Supabase ===
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# === AI Provider (选一个) ===
# Azure OpenAI:
AZURE_OPENAI_API_KEY=xxx
AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com
AZURE_OPENAI_RESOURCE_NAME=xxx
AZURE_OPENAI_DEPLOYMENT=gpt-4

# 或 OpenAI:
# OPENAI_API_KEY=sk-xxx

# === Optional ===
TAVILY_API_KEY=tvly-xxx

# === App URL (部署后更新) ===
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app`,
      successCheck: '部署成功，访问你的 .vercel.app 域名看到应用',
    },
    {
      step: '06',
      titleEn: 'Configure Authentication',
      titleCn: '配置用户认证',
      descEn: 'Set up Supabase Auth redirect URLs.',
      descCn: '配置 Supabase Auth 的重定向 URL。',
      tools: ['Supabase Dashboard'],
      actions: [
        {
          action: '进入 Authentication 设置',
          tool: 'Supabase Dashboard',
          expected: 'Authentication > URL Configuration',
        },
        {
          action: '添加 Redirect URLs',
          tool: 'Supabase',
          expected: '添加你的 Vercel 域名',
        },
      ],
      code: `# 在 Supabase Dashboard > Authentication > URL Configuration

# Site URL:
https://your-app.vercel.app

# Redirect URLs (添加以下两个):
https://your-app.vercel.app/**
http://localhost:3000/**

# 这样用户登录后才能正确跳转回应用`,
      successCheck: '登录/注册功能正常工作',
    },
  ];

  const steps = [
    {
      step: '01',
      titleEn: 'Environment Setup',
      titleCn: '环境准备',
      descEn: 'Install Node.js 18+ and verify your development environment is ready.',
      descCn: '安装 Node.js 18+ 版本，确保开发环境就绪。',
      tools: ['Terminal', 'Node.js'],
      actions: [
        {
          action: '检查是否已安装 Node.js',
          tool: 'Terminal / CMD / PowerShell',
          command: 'node -v',
          expected: '显示版本号，如 v18.17.0 或更高',
          ifFail: '如果显示 "command not found"，需要先安装 Node.js',
        },
        {
          action: '检查 npm 版本',
          tool: 'Terminal',
          command: 'npm -v',
          expected: '显示版本号，如 9.6.7 或更高',
        },
      ],
      code: `# 如果没有 Node.js，请安装：

# macOS (使用 Homebrew):
brew install node

# Windows:
# 访问 https://nodejs.org/ 下载 LTS 版本安装包

# Linux (Ubuntu/Debian):
sudo apt update && sudo apt install nodejs npm

# 安装后再次验证
node -v  # 应显示 v18.x.x 或更高
npm -v   # 应显示 9.x.x 或更高`,
      successCheck: '当 node -v 和 npm -v 都能正常显示版本号时，环境准备完成',
    },
    {
      step: '02',
      titleEn: 'Create Next.js Project',
      titleCn: '创建 Next.js 项目',
      descEn: 'Initialize a new Next.js 15 project with TypeScript and Tailwind CSS.',
      descCn: '使用 TypeScript 和 Tailwind CSS 初始化 Next.js 15 项目。',
      tools: ['Terminal'],
      actions: [
        {
          action: '创建新项目',
          tool: 'Terminal',
          command: 'npx create-next-app@latest my-agent',
          expected: '出现交互式选项提示',
          selectOptions: [
            'Would you like to use TypeScript? → Yes',
            'Would you like to use ESLint? → Yes',
            'Would you like to use Tailwind CSS? → Yes',
            'Would you like your code inside a "src/" directory? → No',
            'Would you like to use App Router? → Yes',
            'Would you like to use Turbopack? → Yes',
            'Would you like to customize the import alias? → No',
          ],
        },
        {
          action: '进入项目目录',
          tool: 'Terminal',
          command: 'cd my-agent',
          expected: '命令行提示符变为 my-agent 目录',
        },
      ],
      code: `# 完整的项目创建过程：

# 1. 创建项目（会自动安装依赖，需要 1-2 分钟）
npx create-next-app@latest my-agent

# 2. 按上述选项回答问题

# 3. 等待看到：
# Success! Created my-agent at /your/path/my-agent

# 4. 进入目录
cd my-agent

# 5. 验证能启动
npm run dev

# 6. 浏览器打开 http://localhost:3000 应该看到 Next.js 欢迎页`,
      successCheck: '浏览器访问 http://localhost:3000 看到 Next.js 默认页面即成功',
    },
    {
      step: '03',
      titleEn: 'Install AI Dependencies',
      titleCn: '安装 AI 核心依赖',
      descEn: 'Add Vercel AI SDK and Azure OpenAI provider for streaming chat and tool calling.',
      descCn: '安装 Vercel AI SDK 和 AI 提供商，用于流式对话和工具调用。',
      tools: ['Terminal'],
      actions: [
        {
          action: '安装 AI SDK 核心包',
          tool: 'Terminal（确保在 my-agent 目录下）',
          command: 'npm install ai @ai-sdk/azure zod',
          expected: '看到 "added X packages" 成功信息',
        },
      ],
      code: `# 各包的作用说明：

npm install ai           # Vercel AI SDK 核心
npm install @ai-sdk/azure # Azure OpenAI 提供商
npm install zod           # 参数类型校验

# 或者一次性安装：
npm install ai @ai-sdk/azure zod

# 如果你使用其他 AI 服务，可以换成：
# npm install @ai-sdk/openai     # OpenAI API
# npm install @ai-sdk/google     # Google Gemini
# npm install @ai-sdk/anthropic  # Claude`,
      successCheck: 'package.json 的 dependencies 中出现 "ai", "@ai-sdk/azure", "zod" 即成功',
    },
    {
      step: '04',
      titleEn: 'Configure Environment Variables',
      titleCn: '配置环境变量',
      descEn: 'Create .env.local file with your API keys. Never commit this file to git.',
      descCn: '创建 .env.local 文件存储 API 密钥。绝对不要提交到 git。',
      tools: ['Terminal', 'VS Code'],
      actions: [
        {
          action: '创建环境变量文件',
          tool: 'Terminal',
          command: 'touch .env.local',
          expected: '在项目根目录创建了 .env.local 文件',
        },
        {
          action: '编辑环境变量',
          tool: 'VS Code 或其他编辑器',
          command: 'code .env.local',
          expected: '打开空白的 .env.local 文件',
        },
      ],
      code: `# .env.local 文件内容（请替换为你的真实 API Key）

# ========== 方案 1: Azure OpenAI (企业推荐) ==========
AZURE_OPENAI_API_KEY=your_azure_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_RESOURCE_NAME=your-resource-name
AZURE_OPENAI_DEPLOYMENT=gpt-4

# ========== 方案 2: OpenAI API (个人开发者推荐) ==========
# OPENAI_API_KEY=sk-your_openai_api_key_here

# ========== 可选: Web 搜索 API ==========
# Tavily 提供免费额度，注册: https://tavily.com
TAVILY_API_KEY=tvly-your_tavily_key_here`,
      successCheck: '确认 .env.local 已添加到 .gitignore（默认已添加），文件中有有效的 API Key',
      warning: '重要：绝不要将 .env.local 提交到 Git，它已默认在 .gitignore 中。',
    },
    {
      step: '05',
      titleEn: 'Create Skill Type Definitions',
      titleCn: '创建 Skill 类型定义',
      descEn: 'Define the TypeScript interfaces that structure all skills in the system.',
      descCn: '定义 TypeScript 接口，规范系统中所有 Skill 的结构。',
      tools: ['Terminal', 'VS Code'],
      actions: [
        {
          action: '创建目录结构',
          tool: 'Terminal',
          command: 'mkdir -p app/api/skills/tools && mkdir -p app/api/chat',
          expected: '创建了 app/api/skills/tools 和 app/api/chat 目录',
        },
        {
          action: '创建类型定义文件',
          tool: 'Terminal',
          command: 'touch app/api/skills/types.ts',
          expected: '创建了 types.ts 文件',
        },
      ],
      code: `// app/api/skills/types.ts
// 复制以下全部内容到该文件

import { CoreTool } from 'ai';

/**
 * Skill Definition - 技能定义
 * 每个 Skill 包含：系统提示词 + 可调用的工具
 */
export interface Skill {
  /** 唯一标识符 */
  id: string;
  
  /** 显示名称 */
  name: string;
  
  /** 功能描述 */
  description: string;
  
  /** 详细的系统提示词（告诉 AI 如何使用这个技能） */
  systemPrompt: string;
  
  /** 该技能包含的工具 */
  tools: Record<string, CoreTool<any, any>>;
  
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * Skill Registry - 技能注册中心
 * 统一管理所有已注册的技能
 */
export class SkillRegistry {
  private skills: Map<string, Skill> = new Map();

  /** 注册一个技能 */
  register(skill: Skill): void {
    this.skills.set(skill.id, skill);
    console.log(\`[SkillRegistry] Registered: \${skill.name}\`);
  }

  /** 获取指定技能 */
  get(skillId: string): Skill | undefined {
    return this.skills.get(skillId);
  }

  /** 获取所有启用的技能 */
  getEnabled(): Skill[] {
    return Array.from(this.skills.values()).filter(s => s.enabled !== false);
  }

  /** 获取所有技能的工具（合并） */
  getAllTools(): Record<string, CoreTool<any, any>> {
    const allTools: Record<string, CoreTool<any, any>> = {};
    for (const skill of this.getEnabled()) {
      Object.assign(allTools, skill.tools);
    }
    return allTools;
  }
}`,
      successCheck: '保存后无 TypeScript 报错，VS Code 没有红色波浪线',
    },
    {
      step: '06',
      titleEn: 'Create Your First Tool',
      titleCn: '创建第一个工具',
      descEn: 'Build a web search tool using Tavily API. This is a real, functional tool.',
      descCn: '使用 Tavily API 构建网页搜索工具。这是一个真实可用的工具。',
      tools: ['Terminal', 'VS Code'],
      actions: [
        {
          action: '创建工具文件',
          tool: 'Terminal',
          command: 'touch app/api/skills/tools/web-search.tool.ts',
          expected: '创建了工具文件',
        },
      ],
      code: `// app/api/skills/tools/web-search.tool.ts

import { tool } from 'ai';
import { z } from 'zod';

export const web_search = tool({
  description: 'Search the web for current information on any topic.',
  
  parameters: z.object({
    query: z.string().describe('The search query'),
    max_results: z.number().optional().default(5),
  }),
  
  execute: async ({ query, max_results }) => {
    console.log(\`[web_search] Searching: \${query}\`);
    
    try {
      const apiKey = process.env.TAVILY_API_KEY;
      
      if (!apiKey) {
        return { 
          success: true, 
          results: [{
            title: 'Mock Result - Configure TAVILY_API_KEY for real search',
            url: 'https://tavily.com',
            content: 'Add TAVILY_API_KEY to .env.local for real web search.',
          }]
        };
      }
      
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, query, max_results }),
      });
      
      if (!response.ok) throw new Error(\`API error: \${response.status}\`);
      
      const data = await response.json();
      return { 
        success: true, 
        results: data.results.map((r: any) => ({
          title: r.title, url: r.url, content: r.content,
        }))
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});`,
      successCheck: '保存后无报错。即使没有 Tavily API Key 也能工作（会返回模拟数据）',
    },
    {
      step: '07',
      titleEn: 'Create Your First Skill',
      titleCn: '创建第一个 Skill',
      descEn: 'Combine the tool with a system prompt to create a complete Web Research skill.',
      descCn: '将工具与系统提示词组合，创建完整的网络研究技能。',
      tools: ['Terminal', 'VS Code'],
      actions: [
        {
          action: '创建 Skill 文件',
          tool: 'Terminal',
          command: 'touch app/api/skills/web-research.skill.ts',
          expected: '创建了技能文件',
        },
      ],
      code: `// app/api/skills/web-research.skill.ts

import { Skill } from './types';
import { web_search } from './tools/web-search.tool';

export const webResearchSkill: Skill = {
  id: 'web-research',
  name: 'Web Research',
  description: 'Search and analyze information from the web',
  
  systemPrompt: \`You are an expert web researcher. 
When the user asks about any topic that requires current information:
1. Use the web_search tool to find relevant, up-to-date information
2. Analyze the search results carefully
3. Synthesize the information into a clear, helpful response
4. Always cite your sources with URLs\`,
  
  tools: { web_search },
  enabled: true,
};`,
      successCheck: '保存后无报错，Skill 正确引用了 types 和 tool',
    },
    {
      step: '08',
      titleEn: 'Create Skill Registry',
      titleCn: '创建 Skill 注册中心',
      descEn: 'Set up the central registry that combines all skills and generates system prompts.',
      descCn: '设置中央注册中心，整合所有技能并生成系统提示词。',
      tools: ['Terminal', 'VS Code'],
      actions: [
        {
          action: '创建注册中心文件',
          tool: 'Terminal',
          command: 'touch app/api/skills/index.ts',
          expected: '创建了 index.ts 文件',
        },
      ],
      code: `// app/api/skills/index.ts

import { SkillRegistry } from './types';
import { webResearchSkill } from './web-research.skill';

export const skillRegistry = new SkillRegistry();
skillRegistry.register(webResearchSkill);

export function getCombinedSystemPrompt(): string {
  const skills = skillRegistry.getEnabled();
  
  return \`You are an AI assistant with specialized capabilities.

Current Time: \${new Date().toLocaleString()}

YOUR CAPABILITIES:
\${skills.map(s => \`- \${s.name}: \${s.description}\`).join('\\n')}

DETAILED INSTRUCTIONS:
\${skills.map(skill => \`
### \${skill.name}
\${skill.systemPrompt}
\`).join('\\n')}

When you use a tool, briefly explain what you're doing and present results clearly.\`;
}`,
      successCheck: '保存后无报错。这是整个 Agent 的"能力中枢"',
    },
    {
      step: '09',
      titleEn: 'Create Chat API Route',
      titleCn: '创建 Chat API 路由',
      descEn: 'Build the backend API that handles streaming chat with tool execution.',
      descCn: '构建后端 API，处理流式对话和工具执行。',
      tools: ['Terminal', 'VS Code'],
      actions: [
        {
          action: '创建 API 路由文件',
          tool: 'Terminal',
          command: 'touch app/api/chat/route.ts',
          expected: '创建了 route.ts 文件',
        },
      ],
      code: `// app/api/chat/route.ts

import { createAzure } from '@ai-sdk/azure';
import { streamText } from 'ai';
import { skillRegistry, getCombinedSystemPrompt } from '../skills';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    if (!process.env.AZURE_OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API Key not configured' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages } = await req.json();
    const tools = skillRegistry.getAllTools();
    
    const azure = createAzure({
      resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
    });

    const result = streamText({
      model: azure(process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4'),
      messages,
      tools,
      system: getCombinedSystemPrompt(),
      maxSteps: 10,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}`,
      successCheck: '保存后无报错',
    },
    {
      step: '10',
      titleEn: 'Create Chat Frontend',
      titleCn: '创建 Chat 前端页面',
      descEn: 'Build a functional chat interface using the useChat hook.',
      descCn: '使用 useChat hook 构建功能完整的聊天界面。',
      tools: ['VS Code'],
      actions: [
        {
          action: '编辑首页文件',
          tool: 'VS Code',
          command: 'code app/page.tsx',
          expected: '打开 page.tsx 文件',
        },
        {
          action: '删除原有内容，粘贴下方代码',
          tool: 'VS Code',
          expected: '替换整个文件内容',
        },
      ],
      code: `// app/page.tsx

'use client';

import { useChat } from 'ai/react';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">My AI Agent</h1>
        <p className="text-sm text-gray-500">Powered by Web Research Skill</p>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">Ask me anything</p>
              <p className="text-sm mt-2">Try: "What are the latest news about AI?"</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={\`p-4 rounded-lg \${
                msg.role === 'user' ? 'bg-blue-500 text-white ml-12' : 'bg-white border mr-12'
              }\`}
            >
              <p className={\`text-xs font-medium mb-2 \${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}\`}>
                {msg.role === 'user' ? 'You' : 'Assistant'}
              </p>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.toolInvocations?.map((tool: any, i: number) => (
                <div key={i} className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <span className="font-mono text-purple-600">{tool.toolName}</span>
                  {tool.state === 'result' && <span className="text-green-600 ml-2">Done</span>}
                </div>
              ))}
            </div>
          ))}
          
          {isLoading && (
            <div className="p-4 bg-white border rounded-lg mr-12">
              <p className="text-gray-400">Thinking...</p>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}`,
      successCheck: '保存后刷新 http://localhost:3000 看到新的聊天界面',
    },
    {
      step: '11',
      titleEn: 'Run and Test',
      titleCn: '运行并测试',
      descEn: 'Start the development server and test the web research capability.',
      descCn: '启动开发服务器，测试网络研究功能。',
      tools: ['Terminal', 'Browser'],
      actions: [
        {
          action: '启动开发服务器',
          tool: 'Terminal',
          command: 'npm run dev',
          expected: '看到 "Local: http://localhost:3000"',
        },
        {
          action: '打开浏览器访问',
          tool: 'Browser',
          command: 'http://localhost:3000',
          expected: '看到聊天界面',
        },
        {
          action: '测试对话',
          tool: 'Browser',
          command: '输入: What are the latest AI news?',
          expected: '看到 web_search 工具被调用，然后返回结果',
        },
      ],
      code: `# 启动服务器
npm run dev

# 终端应该显示：
▲ Next.js 15.x.x
- Local:   http://localhost:3000

# 发送消息时，终端会显示日志：
[web_search] Searching: latest AI news
[web_search] Found 5 results

# 测试提示词：
1. "What are the latest developments in AI?"
2. "Search for React 19 new features"
3. "Find information about TypeScript 5"`,
      successCheck: '能看到工具调用日志，AI 能返回搜索结果，Agent 已经在工作',
    },
    {
      step: '12',
      titleEn: 'Add More Skills',
      titleCn: '添加更多技能',
      descEn: 'Expand your agent with additional skills following the same pattern.',
      descCn: '按照相同模式扩展你的 Agent，添加更多技能。',
      tools: ['VS Code'],
      actions: [
        {
          action: '创建新工具',
          tool: 'Terminal',
          command: 'touch app/api/skills/tools/new-tool.ts',
          expected: '按照 Step 06 的模式编写工具',
        },
        {
          action: '创建新技能',
          tool: 'Terminal',
          command: 'touch app/api/skills/new.skill.ts',
          expected: '按照 Step 07 的模式编写技能',
        },
        {
          action: '注册新技能',
          tool: 'VS Code',
          command: '在 index.ts 中 skillRegistry.register(newSkill)',
          expected: '重启服务器后新技能可用',
        },
      ],
      code: `// 添加新 Skill 的标准流程：

// 1. 创建工具 (tools/analyze-url.tool.ts)
export const analyze_url = tool({
  description: 'Analyze a URL',
  parameters: z.object({ url: z.string().url() }),
  execute: async ({ url }) => {
    return { success: true, data: { url, score: 85 } };
  },
});

// 2. 创建技能 (seo.skill.ts)
export const seoSkill: Skill = {
  id: 'seo',
  name: 'SEO Analysis',
  description: 'Analyze websites for SEO',
  systemPrompt: 'You are an SEO expert...',
  tools: { analyze_url },
  enabled: true,
};

// 3. 注册 (index.ts)
skillRegistry.register(seoSkill);`,
      successCheck: '掌握了添加新 Skill 的模式后，你可以无限扩展 Agent 的能力',
    },
  ];

  return (
    <div ref={containerRef} className="h-screen overflow-y-auto bg-[#FAFAFA] relative font-sans">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] rounded-full bg-purple-50/20 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[40%] rounded-full bg-blue-50/20 blur-[120px]" />
      </div>

      {/* Main Layout */}
      <div className="relative z-10 flex flex-col xl:flex-row min-h-screen">
        
        {/* Left Panel - Product Introduction */}
        <div className="xl:w-[420px] xl:min-w-[420px] xl:sticky xl:top-0 xl:h-screen xl:overflow-y-auto border-b xl:border-b-0 xl:border-r border-gray-100 bg-white/50 backdrop-blur-sm">
          <div className="p-8 xl:p-10">
            {/* Logo & Title */}
            <Link href="/" className="inline-flex items-center gap-3 mb-8 group">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:shadow-md transition-shadow">
                <Image src="/logo.svg" alt="Logo" width={20} height={20} />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{productInfo.name}</h1>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{productInfo.subtitle}</p>
              </div>
            </Link>

            {/* Section 1: Introduction */}
            <section className="mb-8">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-4 h-px bg-gray-200" />
                应用简介
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">{productInfo.intro}</p>
            </section>

            {/* Section 2: Pain Points */}
            <section className="mb-8">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-4 h-px bg-gray-200" />
                业务痛点
              </h2>
              <div className="space-y-3">
                {productInfo.painPoints.map((point, idx) => (
                  <div key={idx} className="p-3 bg-gray-50/80 rounded-lg border border-gray-100">
                    <h3 className="text-xs font-medium text-gray-800 mb-1">{point.title}</h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{point.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3: Target Users */}
            <section className="mb-8">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-4 h-px bg-gray-200" />
                覆盖人群
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">{productInfo.targetUsers}</p>
            </section>

            {/* Section 4: Efficiency */}
            <section className="mb-8">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-4 h-px bg-gray-200" />
                提效说明
              </h2>
              <div className="space-y-3">
                {productInfo.efficiency.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div 
                      className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ background: brandGradient }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-800 mb-0.5">{item.title}</h3>
                      <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 5: Effects */}
            <section className="mb-8">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-4 h-px bg-gray-200" />
                使用效果
              </h2>
              <ul className="space-y-2">
                {productInfo.effects.map((effect, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5 shrink-0">{Icons.check}</span>
                    <span className="leading-relaxed">{effect}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* CTA */}
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <Link
                href="/chat"
                className="flex items-center justify-center gap-2 w-full py-3 text-sm font-medium text-white rounded-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: brandGradient }}
              >
                <span>体验 Demo</span>
                {Icons.arrow}
              </Link>
              <a
                href="https://github.com/Joeyzzyy/mini-seenos"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg transition-all hover:bg-gray-200"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>前往项目</span>
              </a>
              <p className="text-[10px] text-gray-400 text-center mt-2">
                Open Source / MIT License
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Tutorial */}
        <div className="flex-1 min-w-0">
          <div className="max-w-3xl mx-auto py-12 px-6 xl:py-16 xl:px-10">
            {/* Header */}
            <header className="text-center mb-10">
              <h2 className="text-2xl font-light text-gray-900 tracking-tight mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
                Build Guide
              </h2>
              <p className="text-xs text-gray-400 uppercase tracking-widest">Step-by-Step Tutorial</p>
            </header>

            {/* Mode Switcher */}
            <div className="mb-8 flex justify-center">
              <div className="inline-flex items-center p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setMode('quick')}
                  className={`px-4 py-2 text-xs font-medium rounded-md transition-all ${
                    mode === 'quick'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Quick Deploy
                  <span className="ml-1.5 text-[10px] text-gray-400">6 steps</span>
                </button>
                <button
                  onClick={() => setMode('scratch')}
                  className={`px-4 py-2 text-xs font-medium rounded-md transition-all ${
                    mode === 'scratch'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Build from Scratch
                  <span className="ml-1.5 text-[10px] text-gray-400">12 steps</span>
                </button>
              </div>
            </div>

            {/* Mode Description */}
            <div className="mb-6 text-center">
              {mode === 'quick' ? (
                <p className="text-sm text-gray-500">
                  Fork the project and deploy to Vercel in minutes.
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Learn to build an AI Agent from scratch.
                </p>
              )}
            </div>

            {/* Progress */}
            <div className="mb-10 flex justify-center">
              <div className="flex items-center gap-1">
                {(mode === 'quick' ? quickSteps : steps).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => mode === 'quick' ? scrollToQuickStep(idx) : scrollToStep(idx)}
                    className="w-5 h-0.5 rounded-full transition-all duration-300 hover:opacity-80"
                    style={{ 
                      background: (mode === 'quick' ? activeQuickStep : activeStep) !== null && idx <= (mode === 'quick' ? activeQuickStep! : activeStep!) ? brandGradient : '#E5E7EB',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Steps */}
        <div className="space-y-3">
          {(mode === 'quick' ? quickSteps : steps).map((item, idx) => {
            const isActive = mode === 'quick' ? activeQuickStep === idx : activeStep === idx;
            const setActive = mode === 'quick' 
              ? () => setActiveQuickStep(activeQuickStep === idx ? null : idx)
              : () => setActiveStep(activeStep === idx ? null : idx);
            const refSetter = mode === 'quick'
              ? (el: HTMLDivElement | null) => { quickStepRefs.current[idx] = el; }
              : (el: HTMLDivElement | null) => { stepRefs.current[idx] = el; };

            return (
            <div 
              key={idx}
              ref={refSetter}
              className={`bg-white rounded-lg border transition-all duration-300 scroll-mt-8 ${
                isActive ? 'border-gray-200 shadow-sm' : 'border-gray-100'
              }`}
            >
              {/* Step Header */}
              <button
                onClick={setActive}
                className="w-full flex items-center gap-4 p-5 text-left group"
              >
                <div 
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                    isActive 
                      ? 'text-white' 
                      : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'
                  }`}
                  style={isActive ? { background: brandGradient } : {}}
                >
                  {item.step}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-medium text-gray-900">{item.titleEn}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{item.titleCn}</p>
                </div>
                <div className={`transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`}>
                  {Icons.chevron}
                </div>
              </button>

              {/* Step Content */}
              {isActive && (
                <div className="px-5 pb-6 border-t border-gray-50">
                  {/* Description */}
                  <div className="py-4 grid md:grid-cols-2 gap-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{item.descEn}</p>
                    <p className="text-sm text-gray-400 leading-relaxed">{item.descCn}</p>
                  </div>

                  {/* Tools */}
                  <div className="flex items-center gap-2 mb-5 pb-5 border-b border-gray-50">
                    <span className="text-gray-400">{Icons.tools}</span>
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Required</span>
                    <div className="flex gap-1.5 ml-2">
                      {item.tools.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-50 text-gray-500 text-xs rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-gray-400">{Icons.list}</span>
                      <span className="text-xs text-gray-400 uppercase tracking-wide">Steps</span>
                    </div>
                    <div className="space-y-3">
                      {item.actions.map((act, actIdx) => (
                        <div key={actIdx} className="bg-gray-50/50 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <span className="w-5 h-5 rounded bg-gray-100 text-gray-500 text-xs font-medium flex items-center justify-center shrink-0 mt-0.5">
                              {actIdx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 mb-2">{act.action}</p>
                              {act.tool && (
                                <p className="text-xs text-gray-400 mb-2">
                                  Use: <span className="text-gray-500">{act.tool}</span>
                                </p>
                              )}
                              {(act as { command?: string }).command && (
                                <div className="bg-gray-900 rounded-md p-3 mb-2 relative group">
                                  <code className="text-xs font-mono text-gray-300 block whitespace-pre-wrap leading-relaxed">
                                    <span className="text-blue-400 select-none">$ </span>{(act as { command?: string }).command}
                                  </code>
                                  <button 
                                    onClick={() => handleCopy((act as { command?: string }).command!.split('#')[0].split('\n')[0].trim(), `${idx}-${actIdx}`)}
                                    className="absolute top-2 right-2 p-1.5 rounded bg-gray-800 text-gray-500 opacity-0 group-hover:opacity-100 transition-all hover:text-gray-300"
                                  >
                                    {copiedIndex === `${idx}-${actIdx}` ? Icons.check : Icons.copy}
                                  </button>
                                </div>
                              )}
                              <div className="flex items-start gap-1.5 text-xs text-green-600">
                                <span className="mt-0.5 shrink-0">{Icons.check}</span>
                                <span>Expected: {act.expected}</span>
                              </div>
                              {(act as { ifFail?: string }).ifFail && (
                                <div className="flex items-start gap-1.5 text-xs text-amber-600 mt-1.5">
                                  <span className="mt-0.5 shrink-0">{Icons.warning}</span>
                                  <span>{(act as { ifFail?: string }).ifFail}</span>
                                </div>
                              )}
                              {(act as { selectOptions?: string[] }).selectOptions && (
                                <div className="mt-3 p-3 bg-white rounded border border-gray-100">
                                  <p className="text-xs text-gray-400 mb-2">Select options:</p>
                                  {(act as { selectOptions?: string[] }).selectOptions!.map((opt, i) => (
                                    <p key={i} className="text-xs font-mono text-gray-600 leading-relaxed">{opt}</p>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Code */}
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-gray-400">{Icons.code}</span>
                      <span className="text-xs text-gray-400 uppercase tracking-wide">Code</span>
                    </div>
                    <div className="bg-[#0d1117] rounded-lg overflow-hidden relative group">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-gray-700" />
                          <div className="w-2.5 h-2.5 rounded-full bg-gray-700" />
                          <div className="w-2.5 h-2.5 rounded-full bg-gray-700" />
                        </div>
                        <button 
                          onClick={() => handleCopy(item.code, `code-${idx}`)}
                          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-all hover:text-gray-300 hover:bg-gray-800"
                        >
                          {copiedIndex === `code-${idx}` ? Icons.check : Icons.copy}
                          <span>{copiedIndex === `code-${idx}` ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="p-4 text-xs font-mono text-gray-300 leading-relaxed overflow-x-auto">
                        <code>{item.code}</code>
                      </pre>
                    </div>
                  </div>

                  {/* Warning */}
                  {item.warning && (
                    <div className="flex items-start gap-3 p-4 bg-amber-50/50 border border-amber-100 rounded-lg mb-4">
                      <span className="text-amber-500 mt-0.5">{Icons.warning}</span>
                      <p className="text-xs text-amber-700 leading-relaxed">{item.warning}</p>
                    </div>
                  )}

                  {/* Success Check */}
                  <div className="flex items-start gap-3 p-4 bg-gray-50/50 border border-gray-100 rounded-lg">
                    <span className="text-gray-400 mt-0.5">{Icons.target}</span>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Completion Check</p>
                      <p className="text-sm text-gray-600">{item.successCheck}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
          })}
        </div>

            {/* Footer */}
            <footer className="mt-12 text-center">
              <p className="text-xs text-gray-300 tracking-wide" style={{ fontFamily: '"Playfair Display", serif' }}>
                created by yuezhu
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
