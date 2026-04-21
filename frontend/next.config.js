/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  env: {
    NEXT_PUBLIC_GRAPHQL_URL: process.env.GRAPHQL_URL || 'http://localhost:4000/graphql',
    NEXT_PUBLIC_EXPRESS_URL: process.env.EXPRESS_URL || 'http://localhost:5000',
  },
};

export default nextConfig;
