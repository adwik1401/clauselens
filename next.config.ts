import type { NextConfig } from "next";

// Security headers applied to every response.
//
// script-src keeps 'unsafe-inline': a nonce-based CSP (via middleware) was
// attempted and reverted after live browser testing showed Next.js's own
// chunk-loader and hydration scripts weren't picking up the nonce in
// production — every script on the page got blocked by CSP, which would
// have taken the whole site down. Caught before deploy; not worth
// re-attempting this close to a deadline without deeper Next.js-internals
// investigation.
//
// style-src does NOT have 'unsafe-inline', unlike the original version of
// this header: every dynamic inline style in the app (app/page.tsx's
// ambient background, risk-card.tsx's stagger delay, risk-dashboard.tsx's
// meter width) was refactored to fixed CSS classes in globals.css, so
// 'self' alone is sufficient — verified with no CSP violations in
// production browser testing.
const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
