/**
 * Tailwind-based page content template
 * Generates clean, semantic HTML with Tailwind utility classes
 */

export function generatePageContentHTML(params: {
  pageTitle: string;
  seoTitle?: string;
  seoDescription?: string;
  sectionsHTML: string;
}): string {
  const { pageTitle, seoTitle, seoDescription, sectionsHTML } = params;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(seoTitle || pageTitle)}</title>
  ${seoDescription ? `<meta name="description" content="${escapeHtml(seoDescription)}">` : ''}
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  <main class="container mx-auto px-4 py-8 max-w-4xl">
    <article class="bg-white rounded-lg shadow-lg p-8 md:p-12">
      <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-8 pb-4 border-b-4 border-blue-600">
        ${escapeHtml(pageTitle)}
      </h1>
      
${sectionsHTML}
      
    </article>
  </main>
</body>
</html>`;
}

/**
 * Wrap Markdown HTML with Tailwind utility classes
 */
export function wrapMarkdownWithTailwind(markdownHTML: string): string {
  return markdownHTML
    // Paragraphs
    .replace(/<p>/g, '<p class="text-gray-700 leading-relaxed mb-6">')
    // Headings
    .replace(/<h3>/g, '<h3 class="text-2xl font-semibold text-gray-800 mt-8 mb-4">')
    .replace(/<h4>/g, '<h4 class="text-xl font-semibold text-gray-800 mt-6 mb-3">')
    // Lists
    .replace(/<ul>/g, '<ul class="list-disc list-inside space-y-2 mb-6 text-gray-700">')
    .replace(/<ol>/g, '<ol class="list-decimal list-inside space-y-2 mb-6 text-gray-700">')
    .replace(/<li>/g, '<li class="ml-4">')
    // Links
    .replace(/<a href=/g, '<a class="text-blue-600 hover:text-blue-800 underline transition-colors" href=')
    // Strong/Bold
    .replace(/<strong>/g, '<strong class="font-semibold text-gray-900">')
    // Images (if any inline)
    .replace(/<img /g, '<img class="rounded-lg shadow-md my-6 mx-auto max-w-full h-auto" ')
    // Tables (if any)
    .replace(/<table>/g, '<table class="min-w-full divide-y divide-gray-200 my-6">')
    .replace(/<thead>/g, '<thead class="bg-gray-50">')
    .replace(/<tbody>/g, '<tbody class="bg-white divide-y divide-gray-200">')
    .replace(/<th>/g, '<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">')
    .replace(/<td>/g, '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">');
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}



