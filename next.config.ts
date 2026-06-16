import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  output: "standalone",
  // Shopify App Proxy forwards the proxy root path with a trailing slash
  // (/api/shopify/proxy/?...). Without this, Next.js 308-redirects to the
  // non-slash URL; Shopify relays that redirect to the browser as a relative
  // URL, breaking same-origin service-worker registration on the storefront.
  skipTrailingSlashRedirect: true,
  turbopack: {
    root: projectRoot
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "notify.grindctrl.cloud"
      },
      {
        protocol: "https",
        hostname: "grindctrl.cloud"
      }
    ]
  }
};

export default nextConfig;

