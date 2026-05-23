import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

// ---------------------------------------------------------------------------
// Base Next.js config
// ---------------------------------------------------------------------------

const nextConfig: NextConfig = {
  /* config options here */
};

// ---------------------------------------------------------------------------
// PWA wrapper
//
// Wrap order is critical:
//   withSentryConfig( withPWA( nextConfig ) )
//
// Sentry must be the outermost wrapper so it can instrument the full build.
// PWA wraps nextConfig first to inject the service-worker webpack plugin, then
// Sentry wraps the result to add its own webpack plugins on top.
// ---------------------------------------------------------------------------

const withPWAConfig = withPWA({
  dest: "public",

  // Cache pages visited while online so they work offline too.
  cacheOnFrontEndNav: true,

  // Prefer the cache over the network for front-end navigations after the
  // first visit — keeps navigations snappy on slow connections.
  aggressiveFrontEndNavCaching: true,

  // When the browser comes back online, reload the page once so Server
  // Components re-run and the user sees fresh data.
  reloadOnOnline: true,

  // Service workers cause confusion during development (stale caches,
  // missed hot-reload updates). Disable them in dev entirely.
  disable: process.env.NODE_ENV === "development",

  workboxOptions: {
    disableDevLogs: true,

    runtimeCaching: [
      // ------------------------------------------------------------------
      // Supabase REST API — flight search results
      // Strategy: StaleWhileRevalidate so the user sees cached results
      // instantly while fresh data is fetched in the background.
      // TTL: 5 minutes (300 s), max 50 entries.
      // ------------------------------------------------------------------
      {
        urlPattern: /^https:\/\/.+\.supabase\.co\/rest\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "supabase-api-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 300,
          },
        },
      },

      // ------------------------------------------------------------------
      // Next.js static assets — JS/CSS chunks
      // Strategy: CacheFirst — these files are content-hashed so they
      // never change. Cache them for 30 days.
      // ------------------------------------------------------------------
      {
        urlPattern: /^\/_next\/static\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: {
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },

      // ------------------------------------------------------------------
      // Google Fonts — stylesheet + font files
      // Strategy: CacheFirst — fonts don't change for a given URL.
      // Cache for 1 year.
      // ------------------------------------------------------------------
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: {
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
    ],
  },
});

export default withSentryConfig(withPWAConfig(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "flighty",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
