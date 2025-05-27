// // DEV
// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   devIndicators: false,
// };

// export default nextConfig;



// PROD
import type { NextConfig } from "next";

// const isDev = process.env.NODE_ENV === 'development';

// const nextConfig: NextConfig = {
//   devIndicators: false,
//   output: "export",
//   distDir: "out",
//   images: {
//     unoptimized: true,
//   },
//   assetPrefix: isDev ? undefined : '/', // Changed this line
//   trailingSlash: true,
//   // Add basePath configuration
//   basePath: '',
// };

// export default nextConfig;

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  basePath: '',
  assetPrefix: './',
  // Add these optimizations
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  webpack: (config) => {
    // Exclude unnecessary files from build
    config.externals = config.externals || [];
    config.externals.push({
      'ffmpeg-static': 'commonjs ffmpeg-static',
      'yt-dlp-exec': 'commonjs yt-dlp-exec'
    });
    return config;
  },
};

module.exports = nextConfig;