

# Core Web Vitals გამოსწორების გეგმა

## პრობლემების ანალიზი

Lighthouse და CrUX მონაცემებიდან გამომდინარე:

| მეტრიკა | Mobile Lab | Desktop Lab | CrUX Mobile | CrUX Desktop | სტატუსი |
|---------|-----------|------------|-------------|-------------|---------|
| LCP | **9.4s** | 2.1s | 2.9s | 3s | ❌ Failed |
| FCP | **3.7s** | 0.8s | 2.2s | 1.9s | ⚠️ Needs improvement |
| CLS | 0 | **0.341** | 0.01 | **0.24** | ❌ Failed (desktop) |
| TBT/INP | 140ms/— | 0ms/— | —/181ms | —/91ms | ✅ OK |
| TTFB | — | — | 1.1s | 1.1s | ⚠️ Needs improvement |

## მიზეზები და გამოსწორებები

### 1. LCP (9.4s mobile) — ყველაზე კრიტიკული

**მიზეზი:** VIPServicesCarousel-ში ServiceCard სურათები Supabase storage-დან იტვირთება. მობილურზე ეს სურათები LCP ელემენტია და არანაირი preload/priority არ აქვს.

**გამოსწორება:**
- VIPServicesCarousel-ში პირველი 2 სურათისთვის `loading="eager"` და `fetchPriority="high"` დამატება
- ServiceCard-ში სურათებზე explicit `width` და `height` ატრიბუტების დამატება
- SimplifiedSearch-ში 2 Supabase query მთავარ გვერდზე არ არის საჭირო დაუყოვნებლივ — lazy load-ით

### 2. CLS (0.341 desktop) — Layout Shift

**მიზეზი:** 
- CategoryCarousel loading state-დან content-ზე გადასვლა ზომას ცვლის
- VIPServicesCarousel skeleton-დან content-ზე layout shift
- HomeCenterBanner/MobileBanner scroll-ზე გამოჩენისას content-ს ძირს აწვება
- Google Fonts ჩატვირთვისას ტექსტის ზომა იცვლება

**გამოსწორება:**
- CategoryCarousel: loading skeleton-ს იგივე min-height მივცეთ რაც content-ს აქვს
- VIPServicesCarousel: section-ს `min-height` დავუყენოთ რომ loading-დან content-ზე shift არ იყოს
- ServiceCard-ში სურათის container-ს fixed `aspect-ratio` აქვს (OK), მაგრამ `width/height` ატრიბუტი აკლია
- Font loading: `font-display: swap` უკვე არის, მაგრამ `size-adjust` CSS-ით fallback font-ის ზომა შეგვიძლია დავარეგულიროთ

### 3. FCP (3.7s mobile) — Render Blocking

**მიზეზი:** 
- GTM და gtag სკრიპტები head-ში sync/async-ით იტვირთება
- Google Fonts CSS render-blocking-ია (media="print" workaround-ით ნაწილობრივ მოხსნილია)

**გამოსწორება:**
- GTM სკრიპტი `setTimeout`-ით გადავდოთ 2-3 წამით (non-critical)
- gtag.js-ს `defer` დავამატოთ

### 4. Image Delivery (396 KiB savings)

**გამოსწორება:**
- Supabase Storage სურათებისთვის `?width=400&quality=75` transform parameter-ების გამოყენება ServiceCard-ში
- StationsPromo-ში fuel logo სურათებს `width/height` დავამატოთ

### 5. Cache Lifetimes (887 KiB savings)

ეს ძირითადად 3rd party რესურსებზეა (GTM, fonts). Lovable-ს მხრიდან ვერ ვაკონტროლებთ, მაგრამ Supabase სურათების cache policy სწორია.

---

## კონკრეტული ცვლილებები

### ფაილი 1: `index.html`
- GTM სკრიპტი `setTimeout(..., 3000)`-ში გავახვიოთ — FCP-ს არ შეაფერხებს
- gtag.js-ზე `defer` ატრიბუტი

### ფაილი 2: `src/components/services/ServiceCard.tsx`
- `<img>` ტეგს `width` და `height` ატრიბუტები
- Supabase image URL-ს `?width=400&quality=80` transform

### ფაილი 3: `src/components/home/VIPServicesCarousel.tsx`
- section-ს `min-h-[400px]` CLS-ის თავიდან ასარიდებლად
- პირველი 2 ServiceCard-ს `loading="eager"` prop-ის გადაცემა

### ფაილი 4: `src/components/home/CategoryCarousel.tsx`
- Loading skeleton-ს იგივე height მივცეთ რაც real content-ს

### ფაილი 5: `src/components/home/StationsPromo.tsx`
- Fuel logo `<img>` ტეგებს `width/height` ატრიბუტები

### ფაილი 6: `src/components/home/SimplifiedSearch.tsx`
- Categories/cities fetch-ი lazy — არა mount-ზე, არამედ focus-ზე

