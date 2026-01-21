import type { Metadata } from "next";
import "./globals.css";

// Using system fonts to bypass Google Fonts download issues during build
const geistSans = { variable: "--font-geist-sans" };
const geistMono = { variable: "--font-geist-mono" };

export const metadata: Metadata = {
  title: "Alternative Page Generator",
  description: "Alternative Page Generator - AI-powered alternative page generator",
  icons: {
    icon: '/tab-logo.webp',
    shortcut: '/tab-logo.webp',
    apple: '/tab-logo.webp',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
