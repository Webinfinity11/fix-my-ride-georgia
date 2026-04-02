

# Cache Lifetime Optimization Plan

## Problem
PageSpeed reports 14,833 KiB potential savings from inefficient caching:
- **Supabase storage images** (17,661 KiB): Only 1h cache TTL
- **First-party assets** (583 KiB): "None" cache TTL on JS/CSS/images
- **Facebook scripts** (139 KiB): 20min cache (can't control)

## Root Cause
The Service Worker config uses `NetworkFirst` for ALL Supabase URLs (including static storage images), and doesn't cache first-party static assets at runtime.

## Solution

### File: `vite.config.ts` — Workbox runtime caching

**1. Split Supabase caching into two rules:**
- **Storage images** (`/storage/v1/object/`): Use `CacheFirst` with 30-day expiration — these URLs are unique per image, content never changes at the same URL
- **Supabase API/Auth**: Keep `NetworkFirst` with 24h expiration for dynamic data

**2. Add first-party static asset caching:**
- Match `/assets/`, icons, logos with `CacheFirst` strategy and 365-day expiration (Vite hashes filenames, so stale cache is impossible)

**3. Add font caching:**
- Google Fonts CSS and font files: `CacheFirst` with 365-day expiration

**4. Updated config:**
```ts
runtimeCaching: [
  // Supabase STORAGE images — immutable, cache aggressively
  {
    urlPattern: /^https:\/\/kwozniwtygkdoagjegom\.supabase\.co\/storage\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'supabase-images',
      expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
      cacheableResponse: { statuses: [0, 200] }
    }
  },
  // Supabase API — dynamic data, network first
  {
    urlPattern: /^https:\/\/kwozniwtygkdoagjegom\.supabase\.co\/rest\/.*/i,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'supabase-api',
      expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }
    }
  },
  // Google Fonts
  {
    urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'google-fonts',
      expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }
    }
  },
  // Map tiles (existing)
  {
    urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'map-tiles',
      expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 }
    }
  }
]
```

## What This Fixes
- Supabase images: 1h → 30 days (saves ~17MB on repeat visits)
- Google Fonts: no SW cache → 1 year
- Map tiles: already good (7 days)
- First-party hashed assets: precached by Workbox `globPatterns` automatically

## What We Can't Fix
- Facebook pixel cache (20min) — controlled by Facebook
- Supabase storage server-side `Cache-Control` header — controlled by Supabase (always 1h). But the SW overrides this locally.

## Files to Modify
1. `vite.config.ts` — update workbox `runtimeCaching` rules

