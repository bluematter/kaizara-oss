import type { NextConfig } from "next";

const securityHeaders = [
  {
    // Prevent clickjacking attacks
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Prevent MIME type sniffing
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Enable XSS filter in older browsers
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    // Control referrer information sent with requests
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Permissions policy - disable unnecessary browser features
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    // Strict Transport Security - force HTTPS
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
