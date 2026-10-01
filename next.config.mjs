/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Students upload assignment photos/PDFs (max 5 MB) through server actions.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
