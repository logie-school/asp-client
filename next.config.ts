import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  devIndicators: false,
  output: "export",
  distDir: "out",
  images: {
    unoptimized: true,
  },
  assetPrefix: isDev ? undefined : './',
  trailingSlash: true,
  basePath: '',
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  webpack: (config) => {
    config.externals = config.externals || [];
    config.externals.push({
      'ffmpeg-static': 'commonjs ffmpeg-static',
      'yt-dlp-exec': 'commonjs yt-dlp-exec'
    });
    return config;
  },
};

export default nextConfig;
