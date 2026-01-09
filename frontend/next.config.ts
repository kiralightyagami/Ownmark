import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Ignore favicon.ico in app directory to avoid file locking issues
  // Favicon should be in public folder or configured via metadata
  async redirects() {
    return [
      {
        source: "/",
        destination: "/signup",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
