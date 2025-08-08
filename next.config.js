/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['zustand', 'framer-motion', 'lucide-react'],
  },
  // Enable static export so it can be hosted on GitHub Pages if desired
  output: 'export',
};

// Configure basePath/assetPrefix dynamically for GitHub Pages project sites
// Set during CI with envs: GITHUB_PAGES=true and BASE_PATH=/<repo-name>
if (process.env.GITHUB_PAGES === 'true' && process.env.BASE_PATH) {
  const base = process.env.BASE_PATH.startsWith('/')
    ? process.env.BASE_PATH
    : `/${process.env.BASE_PATH}`;
  nextConfig.basePath = base;
  nextConfig.assetPrefix = `${base}/`;
}

module.exports = nextConfig;


