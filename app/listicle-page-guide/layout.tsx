import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Listicle Page Guide | seopages.pro',
    default: 'Listicle Page Guide | seopages.pro',
  },
  description: 'Master the art of creating high-converting "Top 10" and "Best Of" listicle pages. Complete guide with SEO best practices, examples, and copywriting techniques.',
};

export default function ListiclePageGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
