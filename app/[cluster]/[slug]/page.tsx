import { getServiceSupabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

interface PageProps {
  params: Promise<{ cluster: string; slug: string }>;
}

// 定义支持的 cluster 和它们的页面
// Note: listicle guide moved to dedicated /listicle-page-guide route
const CLUSTER_CONFIG: Record<string, {
  title: string;
  basePath: string;
  allowDynamic: boolean; // 是否允许从数据库动态加载
}> = {
  'alternative-page-guide': {
    title: 'Alternative Page Guide',
    basePath: '/alternative-page-guide',
    allowDynamic: false, // 这个 cluster 使用静态文件
  },
  'alternatives': {
    title: 'Alternatives',
    basePath: '/alternatives',
    allowDynamic: true, // 这个 cluster 从数据库加载
  },
};

// 生成静态参数（用于 SSG）
export async function generateStaticParams() {
  const params: { cluster: string; slug: string }[] = [];
  
  // 从静态 HTML 文件目录生成参数
  for (const [cluster, config] of Object.entries(CLUSTER_CONFIG)) {
    if (!config.allowDynamic) {
      try {
        const dirPath = path.join(process.cwd(), 'public', 'pages', cluster);
        const files = await fs.readdir(dirPath);
        
        for (const file of files) {
          if (file.endsWith('.html') && file !== 'index.html' && file !== 'cluster-index.html') {
            const slug = file.replace('.html', '');
            params.push({ cluster, slug });
          }
        }
      } catch {
        // 目录不存在，跳过
      }
    }
  }
  
  return params;
}

// 生成元数据
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cluster, slug } = await params;
  
  // 尝试从数据库获取
  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from('content_items')
    .select('seo_title, seo_description, slug')
    .eq('slug', slug)
    .single();
  
  if (data) {
    return {
      title: data.seo_title,
      description: data.seo_description,
    };
  }
  
  // 从静态文件提取元数据
  try {
    const html = await getStaticHtmlContent(cluster, slug);
    if (html) {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      
      return {
        title: titleMatch?.[1] || slug,
        description: descMatch?.[1] || '',
      };
    }
  } catch {
    // 静态文件不存在
  }
  
  return {
    title: slug.replace(/-/g, ' '),
  };
}

// 从静态 HTML 文件获取内容
async function getStaticHtmlContent(cluster: string, slug: string): Promise<string | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'pages', cluster, `${slug}.html`);
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch {
    return null;
  }
}

// 从数据库获取内容
async function getDatabaseContent(slug: string): Promise<string | null> {
  const supabase = getServiceSupabase();
  
  const { data, error } = await supabase
    .from('content_items')
    .select('generated_content, status')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  
  if (error || !data?.generated_content) {
    return null;
  }
  
  return data.generated_content;
}

export default async function ClusterPage({ params }: PageProps) {
  const { cluster, slug } = await params;
  
  // 检查是否是支持的 cluster
  const clusterConfig = CLUSTER_CONFIG[cluster];
  if (!clusterConfig) {
    notFound();
  }
  
  let htmlContent: string | null = null;
  
  // 根据 cluster 配置决定从哪里获取内容
  if (clusterConfig.allowDynamic) {
    // 优先从数据库获取
    htmlContent = await getDatabaseContent(slug);
    
    // 如果数据库没有，尝试静态文件
    if (!htmlContent) {
      htmlContent = await getStaticHtmlContent(cluster, slug);
    }
  } else {
    // 只从静态文件获取
    htmlContent = await getStaticHtmlContent(cluster, slug);
    
    // 如果静态文件没有，尝试数据库
    if (!htmlContent) {
      htmlContent = await getDatabaseContent(slug);
    }
  }
  
  if (!htmlContent) {
    notFound();
  }
  
  // 提取 body 内容（去掉 <!DOCTYPE>, <html>, <head> 等）
  // 对于完整的 HTML 页面，我们使用 iframe 或直接渲染
  const isFullHtml = htmlContent.includes('<!DOCTYPE') || htmlContent.includes('<html');
  
  if (isFullHtml) {
    // 完整 HTML 页面 - 使用 dangerouslySetInnerHTML 直接渲染
    // 提取 body 内容和 head 中的样式/脚本
    const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const headMatch = htmlContent.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    
    const bodyContent = bodyMatch?.[1] || htmlContent;
    const headContent = headMatch?.[1] || '';
    
    // 提取 style 和 script 标签
    const styleMatches = headContent.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
    const scriptMatches = headContent.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
    
    // 合并样式和脚本
    const styles = styleMatches.join('\n');
    const scripts = scriptMatches.filter(s => !s.includes('application/ld+json')).join('\n');
    
    return (
      <>
        {/* 注入样式 */}
        <div dangerouslySetInnerHTML={{ __html: styles }} />
        
        {/* 渲染 body 内容 */}
        <div 
          className="seo-page-content"
          dangerouslySetInnerHTML={{ __html: bodyContent }} 
        />
        
        {/* 注入脚本 */}
        <div dangerouslySetInnerHTML={{ __html: scripts }} />
      </>
    );
  }
  
  // 部分 HTML 内容 - 直接渲染
  return (
    <div 
      className="seo-page-content"
      dangerouslySetInnerHTML={{ __html: htmlContent }} 
    />
  );
}
