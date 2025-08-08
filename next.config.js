/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['zustand', 'framer-motion', 'lucide-react'],
  },
  // Enable static export so it can be hosted on GitHub Pages if desired
  output: 'export',
};

module.exports = nextConfig;


