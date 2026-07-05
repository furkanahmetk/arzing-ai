/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_CSPR_CLICK_APP_NAME: process.env.NEXT_PUBLIC_CSPR_CLICK_APP_NAME || 'CasperGuard AI',
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000',
    NEXT_PUBLIC_CASPER_NETWORK: process.env.NEXT_PUBLIC_CASPER_NETWORK || 'casper-test',
  },
}

module.exports = nextConfig
