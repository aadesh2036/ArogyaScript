/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // If Vercel provides a system URL (like for preview branches), use it to map to the backend.
    // Otherwise fallback to whatever the user put in NEXT_PUBLIC_API_URL or localhost.
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api` : 'http://localhost:5000/api'),
  },
};

module.exports = nextConfig;
