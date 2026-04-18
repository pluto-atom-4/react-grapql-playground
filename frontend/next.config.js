/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    dirs: ['app', 'components', 'lib'],
  },
  env: {
    NEXT_PUBLIC_GRAPHQL_URL: process.env.GRAPHQL_URL || 'http://localhost:4000/graphql',
    NEXT_PUBLIC_EXPRESS_URL: process.env.EXPRESS_URL || 'http://localhost:5000',
  },
  // Enable SWR for data fetching (used with Apollo)
  headers: (): import('next').NextConfig['headers'] | null | undefined => {
    const headersList: import('next').NextConfig['headers'] = [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ]
    return headersList
  },
};

export default nextConfig;
