import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  ...(isDev
    ? {
        async rewrites() {
          return [{ source: "/contact.php", destination: "/api/contact" }];
        },
      }
    : {}),
};

export default nextConfig;
