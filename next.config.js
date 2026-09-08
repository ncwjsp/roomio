/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    domains: ["roomio-storage.s3.ap-southeast-1.amazonaws.com"],
  },
};

module.exports = nextConfig;
