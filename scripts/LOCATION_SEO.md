# City and brand catalogue SEO

- `/city/:citySlug` is the city hub. `/category/:categorySlug/city/:citySlug` is a category within a city.
- `/category/:categorySlug/:district` and all existing brand/model/district paths retain their meaning. Unknown district slugs do not render a duplicate category hub.
- Cities use the explicit registry in `src/data/cities.json`, independently of Georgian category transliteration. Do not invent city paths by treating cities as districts.
- The city/category-city index gate is shared between the runtime and sitemap generator through `src/data/location-indexing.json`: at least 5 active services and 2 distinct providers. This is an editorial starting policy, not a Google requirement. Review with inventory quality and Search Console evidence.
- Nonempty developing pages remain accessible and prerendered, with their own canonical and `noindex`; they are excluded from `city-sitemap.xml`. The render manifest includes both eligible and developing routes. Empty combinations are not generated into the manifest or sitemap.
- City pages show real inventory/provider counts and links to their available local service categories. Category hubs cover Georgia; city pages have the corresponding local H1 and breadcrumb.
- City and supported brand choices are native anchor links. Category switching on a city page retains the city. Brand switching uses existing `/brand/:brandSlug` hubs; no new city × brand × category indexable cluster is generated.
- A brand's optional `?city=` view is a user filter with `noindex` and canonical to the established brand hub. Brand specialist eligibility and existing brand/model/district SEO content are preserved.
- Legacy city-only query views on `/services` and category hubs normalize client-side to the corresponding city route. These are SPA navigations, not HTTP 301 redirects. Complex query filters keep their existing behavior.
- `npm run build` refreshes the location sitemap/manifest and prerenders the new route documents. To refresh from a saved public inventory, run `node scripts/update-location-sitemap.mjs --input <json>` where JSON contains `services` and `categories` arrays. This input must represent the complete active public inventory, not a paginated sample.
- Unknown paths use the application's NotFound component. True HTTP 404 behavior depends on hosting; do not claim client-rendered NotFound is a server 404.

## Combining category, city and brand

- All three choices can coexist. For example: `/category/dzravis-sheketeba/city/rustavi?brands=Toyota`.
- Category and city choices retain selected brands; category choices from a brand hub carry that brand into the category query. Removing a brand retains category/city.
- A single brand without a category/city still opens the existing `/brand/:slug` hub. Multiple supplemental brands use a deterministic, deduplicated `brands` query.
- Category/city pages read the brand query before fetching, so refresh, sharing and browser history restore the same filters.
- Supplemental brand views use `noindex, follow` and canonical to the clean category/city page. They are not added to sitemaps. Brand-only hubs retain their existing specialist index policy.
- In a category/city context, brand choices are buttons, preventing crawlers from enumerating every multi-brand combination. Navigation links that carry supplemental query filters use `nofollow`; clean canonical links remain available in breadcrumbs and local category sections.

Catalogue ordering uses session-stable, provider-round-robin rotation by default. Existing active Super VIP / VIP tiers remain ahead; rotation applies within tiers. Only lightweight matching IDs are read across the whole filtered set before paginating full cards, so rotation is not restricted to the newest 24 services. sessionStorage preserves the filtered ID snapshot across reloads/native navigation in the same tab; additions join in a new session. Inactive/deleted services are still excluded by the live detail query. Explicit user sorting bypasses rotation. No rotation parameters or additional URLs are generated; prerender uses a deterministic seed and retains the same canonical, robots and structured data policies. Rotation distributes exposure opportunities across sessions, not guaranteed equal impressions or calls globally.
