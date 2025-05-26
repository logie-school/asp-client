// // DEV
// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   devIndicators: false,
// };

// export default nextConfig;



// PROD
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  devIndicators: false,
  output: "export",
  distDir: "out",
  images: {
    unoptimized: true,
  },
  assetPrefix: isDev ? undefined : '/', // Changed this line
  trailingSlash: true,
  // Add basePath configuration
  basePath: '',
};

export default nextConfig;