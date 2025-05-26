// DEV
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false
};

export default nextConfig;



// PROD
// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   output: "export",
//   distDir: "out",
//   images: {
//     unoptimized: true,
//   },
//   assetPrefix: process.env.NODE_ENV === "production" ? "./" : "/", // Use relative paths for production
// };

// export default nextConfig;