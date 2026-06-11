/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  // Pin the Turbopack workspace root to this project to avoid the
  // "inferred workspace root" warning when a parent lockfile exists.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
