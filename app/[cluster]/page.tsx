import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

interface PageProps {
  params: Promise<{ cluster: string }>;
}

// 定义支持的 cluster
// Note: listicle guide moved to dedicated /listicle-page-guide route
const SUPPORTED_CLUSTERS = ['alternative-page-guide'];

// 生成静态参数
export async function generateStaticParams() {
  return SUPPORTED_CLUSTERS.map(cluster => ({ cluster }));
}

// 生成元数据
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cluster } = await params;
  
  const titles: Record<string, string> = {
    'alternative-page-guide': 'Alternative Page Guide - Complete Resource | seopages.pro',
  };
  
  const descriptions: Record<string, string> = {
    'alternative-page-guide': 'Complete guide to creating high-converting alternative and comparison pages.',
  };
  
  return {
    title: titles[cluster] || cluster,
    description: descriptions[cluster] || '',
  };
}

// 从静态 HTML 文件获取内容
async function getStaticHtmlContent(cluster: string): Promise<string | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'pages', cluster, 'index.html');
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch {
    return null;
  }
}

// 从 HTML 提取 body 内容
function extractBodyContent(html: string): { content: string; styles: string } {
  // 提取 head 中的 style
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headContent = headMatch?.[1] || '';
  const styleMatches = headContent.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
  const styles = styleMatches.join('\n');
  
  // 提取 body 内容
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyContent = bodyMatch?.[1] || html;
  
  // 移除 nav（header）
  bodyContent = bodyContent.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  
  // 移除 footer
  bodyContent = bodyContent.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  
  return { content: bodyContent.trim(), styles };
}

export default async function ClusterIndexPage({ params }: PageProps) {
  const { cluster } = await params;
  
  // 检查是否是支持的 cluster
  if (!SUPPORTED_CLUSTERS.includes(cluster)) {
    notFound();
  }
  
  // 从静态文件获取内容
  const htmlContent = await getStaticHtmlContent(cluster);
  
  if (!htmlContent) {
    notFound();
  }
  
  // 提取 body 内容
  const { content, styles } = extractBodyContent(htmlContent);
  
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <SiteHeader />
      
      {styles && (
        <style dangerouslySetInnerHTML={{ __html: styles.replace(/<\/?style[^>]*>/gi, '') }} />
      )}
      
      <script src="https://cdn.tailwindcss.com" />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    brand: {
                      purple: '#9A8FEA',
                      blue: '#65B4FF',
                      orange: '#FFAF40',
                    }
                  },
                  fontFamily: {
                    sans: ['Inter', 'system-ui', 'sans-serif'],
                    serif: ['Playfair Display', 'Georgia', 'serif'],
                  }
                }
              }
            }
          `,
        }}
      />
      
      <div 
        className="seo-page-content"
        dangerouslySetInnerHTML={{ __html: content }} 
      />
      
      <SiteFooter />
    </div>
  );
}
