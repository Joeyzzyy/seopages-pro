import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
  devIndicators: {
    position: 'bottom-right',
  },
  async rewrites() {
    return [
      {
        source: '/test-rendering/:path*',
        destination: 'https://mini-seenos-page-rendering.vercel.app/zhuyuejoey.com/test-rendering/:path*',
      },
    ];
  },
};

export default nextConfig;
