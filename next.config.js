/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    WHOP_API_KEY: process.env.WHOP_API_KEY,
    NEXT_PUBLIC_WHOP_APP_ID: process.env.NEXT_PUBLIC_WHOP_APP_ID,
    WHOP_WEBHOOK_SECRET: process.env.WHOP_WEBHOOK_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
  },
}

module.exports = nextConfig
