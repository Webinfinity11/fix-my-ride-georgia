

# Core Web Vitals & Performance Optimization Plan

## Current State (PageSpeed Insights)

| Metric | Mobile | Desktop | Target |
|--------|--------|---------|--------|
| Performance | 58 | 63 | 80+ |
| LCP | 3s (field) / 46.2s (lab) | 7.7s | <2.5s |
| FCP | 2.4s / 3.8s | 0.9s | <1.8s |
| INP | 231ms | - | <200ms |
| CLS | 0.01 | 0.132 | <0.1 |

**277 URLs need improvement (mobile LCP), 18 URLs INP issues**

Key Lighthouse insights: Image delivery (17.5MB savings), render-blocking requests (1,130ms), unused JS (245KB), cache lifetimes (14.8MB), images without width/height, 7 long tasks.

---

## Plan (5 Areas)

### 1. LCP Fix — Critical Rendering Path

**Problem:** LCP element (likely Hero text or VIP carousel image) loads too late because the entire app bundle must parse before anything renders.

**Changes:**

**`index.html`:**
- Move Google Fonts from `<link>` to inline `@font-face` with `font-display: swap` for the critical weight (400) only — eliminates render-blocking font request
- Remove the Leaflet CSS preload from `<head>` entirely — it's only needed on `/map` page, not homepage

**`src/App.tsx`:**
- The Index page is already eagerly imported — good
- Lazy load `EvacuatorDialog` inside `Index.tsx` (it's a dialog, never visible on initial render)

**`src/pages/Index.tsx`:**
- Remove unused `DollarSign` import from lucide-react
- Lazy load `HomeCenterBanner` and `MobileBanner` (they only show after scroll/interaction)
- Lazy load `StationsPromo` section (below the fold)
- Move stats data outside the component (already done, good)

### 2. Image Optimization

**Problem:** 17.5MB potential image savings. VIP service card images load full-size.

**Changes:**

**`src/components/services/ServiceCard.tsx`:**
- Change Supabase image transform from `?width=400&quality=75` to `?width=400&height=300&quality=70&resize=cover` — adds height constraint and slightly lower quality for smaller file size
- Add `fetchpriority="low"` for non-priority images explicitly

**`src/components/home/StationsPromo.tsx`:**
- Fuel brand logos already have `loading="lazy"` and dimensions — good

**`src/components/layout/Header.tsx`:**
- Logo already has `fetchPriority="high"` — good

### 3. JavaScript Bundle Optimization

**Problem:** 245KB unused JS on initial load.

**Changes:**

**`vite.config.ts`:**
- Add more granular manual chunks to split the bundle:
  - `'embla': ['embla-carousel-react']` — carousel only needed on pages with carousels
  - `'supabase': ['@supabase/supabase-js']` — separate from main bundle
  - `'helmet': ['react-helmet-async']` — SEO utility
- Add `build.target: 'es2020'` to avoid legacy JS polyfills (13KB savings noted by Lighthouse)

**`src/pages/Index.tsx`:**
- Dynamic import for below-fold sections:
```tsx
const StationsPromo = lazy(() => import("@/components/home/StationsPromo"));
const HomeCenterBanner = lazy(() => import("@/components/banners/HomeCenterBanner"));
const MobileBanner = lazy(() => import("@/components/banners/MobileBanner"));
```

### 4. CLS Fix (Desktop 0.132)

**Problem:** Layout shifts on desktop, likely from VIP carousel and dynamic content loading.

**Changes:**

**`src/components/home/VIPServicesCarousel.tsx`:**
- Already has `min-height` — good
- Add `will-change: transform` to carousel container for smoother animations

**`src/components/home/CategoryCarousel.tsx`:**
- Loading skeleton already has `minHeight: '112px'` — good
- But the loaded carousel doesn't match — add `min-h-[112px]` to the carousel container too

**`src/pages/Index.tsx`:**
- Add explicit `min-h` to the registration section and stats section to prevent CLS from lazy-loaded content

### 5. INP Optimization (231ms > 200ms target)

**Problem:** Interaction delays likely from heavy re-renders on user input.

**Changes:**

**`src/components/home/SimplifiedSearch.tsx`:**
- Debounce the `setSearchTerm` with a 150ms delay to avoid re-renders on every keystroke
- Use `startTransition` for the category/city data fetch to mark it as non-urgent

**`src/components/services/ServiceCard.tsx`:**
- Wrap `handleViewDetails` and `handleViewMechanic` in `useCallback` to prevent unnecessary re-creation
- The `useNavigate` is fine as-is

**`src/components/home/CategoryCarousel.tsx`:**
- Wrap `handleCategoryClick` in `useCallback`

### 6. Render-Blocking Resources (1,130ms savings)

**`index.html`:**
- Google Fonts: already using `media="print"` trick — good
- Leaflet CSS: Remove the preload entirely from index.html. Instead, import it dynamically only in the Map page component
- GTM: already deferred by 3s — good
- gtag.js: change from `defer` to loading inside the same `setTimeout` as GTM (after 3s) to eliminate it as render-blocking

---

## Expected Impact

| Metric | Current | Expected |
|--------|---------|----------|
| Performance (Mobile) | 58 | 75-85 |
| LCP (Mobile) | 3s | <2.5s |
| FCP (Mobile) | 2.4s | <1.8s |
| INP | 231ms | <200ms |
| CLS (Desktop) | 0.132 | <0.1 |

## Files to Modify
1. `index.html` — remove Leaflet preload, defer gtag alongside GTM
2. `vite.config.ts` — add build target and chunk splitting
3. `src/pages/Index.tsx` — lazy load below-fold components
4. `src/components/services/ServiceCard.tsx` — optimize image transforms, memoize handlers
5. `src/components/home/SimplifiedSearch.tsx` — debounce search input
6. `src/components/home/CategoryCarousel.tsx` — add min-height to loaded state, memoize handler
7. `src/components/home/VIPServicesCarousel.tsx` — minor CLS prevention

