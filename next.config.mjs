/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  poweredByHeader: false,
  async headers() {
    const developmentScript = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
    const contentSecurityPolicy = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${developmentScript}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://photon.komoot.io",
      "frame-src https://checkout.stripe.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
      "object-src 'none'",
      "upgrade-insecure-requests"
    ].join("; ");

    return [{
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" }
      ]
    }];
  }
};

export default nextConfig;
