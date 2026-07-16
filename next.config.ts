import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Hosts that serve listing/banner imagery. next/image throws at runtime on any
    // remote host not listed here, so keep this in sync with the upload providers.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          {
            // Allow Google OAuth popup to postMessage back to this window.
            // The default "same-origin" (set by Next.js security hardening) blocks it.
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
