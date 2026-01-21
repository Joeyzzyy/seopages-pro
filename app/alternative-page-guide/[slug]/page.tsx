import { getServiceSupabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const CLUSTER = 'alternative-page-guide';

// 生成静态参数（用于 SSG）
export async function generateStaticParams() {
  const params: { slug: string }[] = [];
  
  try {
    const dirPath = path.join(process.cwd(), 'public', 'pages', CLUSTER);
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      if (file.endsWith('.html') && file !== 'index.html' && file !== 'cluster-index.html') {
        const slug = file.replace('.html', '');
        params.push({ slug });
      }
    }
  } catch {
    // 目录不存在，跳过
  }
  
  return params;
}

// 从静态 HTML 文件获取内容
async function getStaticHtmlContent(slug: string): Promise<string | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'pages', CLUSTER, `${slug}.html`);
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch {
    return null;
  }
}

// 从数据库获取内容
async function getDatabaseContent(slug: string): Promise<{
  content: string;
  seoTitle: string;
  seoDescription: string;
} | null> {
  const supabase = getServiceSupabase();
  
  const { data, error } = await supabase
    .from('content_items')
    .select('generated_content, seo_title, seo_description, status')
    .eq('slug', slug)
    .in('status', ['published', 'generated'])
    .single();
  
  if (error || !data?.generated_content) {
    return null;
  }
  
  return {
    content: data.generated_content,
    seoTitle: data.seo_title,
    seoDescription: data.seo_description,
  };
}

// 从 HTML 提取元数据
function extractMetaFromHtml(html: string): { title: string; description: string } {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  
  return {
    title: titleMatch?.[1]?.replace(' | seopages.pro', '') || '',
    description: descMatch?.[1] || '',
  };
}

// 从 HTML 提取 body 内容（去掉 nav 和 footer）
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

// 生成元数据
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  // 优先从静态文件获取
  const staticHtml = await getStaticHtmlContent(slug);
  if (staticHtml) {
    const meta = extractMetaFromHtml(staticHtml);
    return {
      title: meta.title,
      description: meta.description,
      openGraph: {
        title: meta.title,
        description: meta.description,
        url: `https://seopages.pro/${CLUSTER}/${slug}`,
      },
    };
  }
  
  // 尝试从数据库获取
  const dbContent = await getDatabaseContent(slug);
  if (dbContent) {
    return {
      title: dbContent.seoTitle,
      description: dbContent.seoDescription,
    };
  }
  
  return {
    title: slug.replace(/-/g, ' '),
  };
}

export default async function ClusterSlugPage({ params }: PageProps) {
  const { slug } = await params;
  
  let htmlContent: string | null = null;
  
  // 优先从静态文件获取
  htmlContent = await getStaticHtmlContent(slug);
  
  // 如果静态文件没有，尝试数据库
  if (!htmlContent) {
    const dbContent = await getDatabaseContent(slug);
    if (dbContent) {
      htmlContent = dbContent.content;
    }
  }
  
  if (!htmlContent) {
    notFound();
  }
  
  // 提取 body 内容（去掉 nav 和 footer）
  const { content, styles } = extractBodyContent(htmlContent);
  
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* 共享 Header */}
      <SiteHeader />
      
      {/* 注入原始样式 */}
      {styles && (
        <style dangerouslySetInnerHTML={{ __html: styles.replace(/<\/?style[^>]*>/gi, '') }} />
      )}
      
      {/* Tailwind CSS */}
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
      
      {/* 页面内容 */}
      <div 
        className="seo-page-content"
        dangerouslySetInnerHTML={{ __html: content }} 
      />
      
      {/* 共享 Footer */}
      <SiteFooter />
    </div>
  );
}
