

# SEO შეფასება — fixup.ge

## რა გვაქვს კარგად (✅)

1. **SEOHead კომპონენტი** — `react-helmet-async`-ით title, description, OG tags, Twitter cards, canonical URL სრულად იმართება
2. **Structured Data (Schema.org)** — Organization, LocalBusiness, Service, Product, Person, FAQ, Breadcrumb, Review, CollectionPage სქემები
3. **Structured Data ვალიდაცია** — ფასები და რეიტინგები ვალიდირდება (არასწორი მნიშვნელობები არ ჩაისმის)
4. **Dynamic SEO titles/descriptions** — სერვისის, მექანიკოსის, კატეგორიის გვერდებზე დინამიური meta tags
5. **Canonical URLs** — ყველა მთავარ გვერდზე canonical URL-ები
6. **Sitemap.xml** — სტატიკური + დინამიური (edge function-ით გენერაცია), sitemap-index.xml
7. **robots.txt** — სწორად კონფიგურირებული (dashboard/admin დახურული)
8. **Google Tag Manager + gtag** — ანალიტიკა ინტეგრირებული
9. **Google Site Verification** — meta tag დამატებული
10. **OG Image** — დეფაულტი + დინამიური გენერაცია (ogImageGenerator.ts)
11. **Breadcrumbs** — სერვისის დეტალურ გვერდზე + schema markup
12. **Georgian language** — `lang="ka"`, `og:locale="ka_GE"`
13. **PWA manifest** — manifest.webmanifest
14. **Lazy loading** — კოდის სპლიტინგი route-ებით

---

## რა გვაკლია / გასაუმჯობესებელი (❌)

### კრიტიკული პრობლემები

**1. SPA + SEO ფუნდამენტური პრობლემა**
React SPA აპლიკაციაა — Google bot-ი JavaScript-ს ასრულებს, მაგრამ სხვა სოციალური ქსელების crawler-ები (Facebook, Telegram, LinkedIn) ვერ კითხულობენ დინამიურ meta tags-ს. OG tags მხოლოდ `index.html`-ის სტატიკური მნიშვნელობები ჩანს sharing-ისას.

**გადაწყვეტა:** SSR/prerendering edge function, რომელიც crawler-ებს წინასწარ დარენდერილ HTML-ს მიაწვდის.

**2. რამდენიმე გვერდს meta tags საერთოდ არ აქვს**
- `About.tsx` — არ აქვს SEOHead, არ აქვს title/description
- `NotFound.tsx` — არ აქვს 404 meta tags
- `Laundries.tsx` — აქვს SEOHead მაგრამ canonical URL `window.location.origin`-ით (არ არის fixup.ge)
- `Blog.tsx` — Helmet იყენებს `window.location.origin`-ით canonical-ს

**3. Sitemap მოძველებულია**
`lastmod` თარიღი `2025-10-29` — სტატიკური ფაილია, ხელით განახლებას საჭიროებს. Edge function არსებობს (`generate-sitemap`) მაგრამ ავტომატური განახლება არ არის სრულად ინტეგრირებული.

### SEO გაუმჯობესებები

**4. hreflang tags არ არის**
თუ მომავალში მულტიენოვანი ვერსია იგეგმება, hreflang tags დასჭირდება.

**5. Blog ArticleSchema არასრულია**
`BlogPost.tsx`-ში `BlogPosting` schema-ში `datePublished` აქვს, მაგრამ `dateModified`, `publisher`, `mainEntityOfPage` აკლია.

**6. Image alt tags / lazy loading**
გვერდებზე სურათებს ხშირად არ აქვს ოპტიმიზირებული alt ატრიბუტები ქართულ ენაზე.

**7. Core Web Vitals ოპტიმიზაცია**
- `index.html`-ში inline CSS + external fonts + GTM + gtag ერთდროულად იტვირთება — LCP/FID შეიძლება დაზარალდეს
- Leaflet CSS `unpkg`-დან იტვირთება — შეიძლება ლოკალურად ჩაისმას

**8. URL სტრუქტურა**
- `/service/:id` და `/service/:slug` ორივე route არსებობს — duplicate content რისკი
- კატეგორიებისთვის `/category/:slug` და `/services/:slug` ორივე მუშაობს

**9. Internal linking**
კატეგორიის გვერდებიდან სერვისებზე და მექანიკოსებზე cross-linking სუსტია.

**10. 404 გვერდს არ აქვს proper HTTP status**
SPA-ში 404 გვერდი რეალურად 200 status-ით ბრუნდება. სერვერის კონფიგურაციაა საჭირო.

---

## პრიორიტეტების რეკომენდაცია

| პრიორიტეტი | თასქი | სირთულე |
|-----------|-------|---------|
| 🔴 მაღალი | SSR/Prerendering crawler-ებისთვის (OG sharing fix) | მაღალი |
| 🔴 მაღალი | ყველა გვერდზე SEOHead დამატება (About, NotFound, etc.) | დაბალი |
| 🟡 საშუალო | BlogPosting schema გაუმჯობესება | დაბალი |
| 🟡 საშუალო | Duplicate route-ების canonical redirect | საშუალო |
| 🟡 საშუალო | Sitemap ავტომატური განახლება | საშუალო |
| 🟢 დაბალი | Image alt tags ოპტიმიზაცია | დაბალი |
| 🟢 დაბალი | Core Web Vitals ოპტიმიზაცია | საშუალო |

---

## შეჯამება

პროექტს SEO-ს ტექნიკური ინფრასტრუქტურა კარგად აქვს — structured data, meta tags, canonical URLs, sitemap. მთავარი პრობლემა **SPA-ს ფუნდამენტური შეზღუდვაა**: სოციალურ ქსელებში sharing-ისას OG tags არ მუშაობს სწორად, რადგან crawler-ები JavaScript-ს ვერ ასრულებენ. ასევე რამდენიმე გვერდს მეტა თეგები საერთოდ აკლია.

