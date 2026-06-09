## აუდიტის ანალიზი — რა გავაკეთოთ მარტივად

აუდიტი კარგია, მაგრამ ნაწილი უკვე გვაქვს გაკეთებული (SEOHead, sitemap, lazy-image, breadcrumbs, structured data). ქვემოთ ვაჯგუფე **მარტივი + მაღალი ROI** ფიქსები, რაც რეალურად მოგვარდება სწრაფად.

### 🔴 ფაზა 1 — Security & Privacy (კრიტიკული, ~2 სთ)

1. **XSS დაცვა — DOMPurify**
   - დავამატოთ `dompurify` პაკეტი
   - ვცვლით `dangerouslySetInnerHTML`-ს `BlogPost.tsx`-ში და `PostCard.tsx`-ში sanitized HTML-ით
   - Allow-list: ჩვეულებრივი ფორმატირება, ბმულები, სურათები. Block: `<script>`, `on*` ჰენდლერები, `javascript:` URL-ები

2. **console.log გასუფთავება production-ში**
   - `vite.config.ts`-ში დავამატოთ `esbuild.drop: ['console', 'debugger']` production build-ისთვის
   - მარტივად შლის ყველა 497 statement-ს deploy-ის დროს, dev-ში არ აზიანებს
   - სენსიტიური auth/chat ლოგებიდან აშორებს PII-ს browser console-დან

3. **Map.tsx popup HTML injection**
   - მინიმუმ encodeURI/escape user-მოწოდებულ ველებზე (photo URL, name, address) template literal-ში
   - სრული React-popup refactor დიდი სამუშაოა — ჯერ escape

### 🔴 ფაზა 2 — Resilience (~30 წთ)

4. **Global ErrorBoundary**
   - `src/components/ErrorBoundary.tsx` ვქმნით (class component + fallback UI ქართულად)
   - `App.tsx`-ში ვახვევთ `<Suspense>`-ის ირგვლივ
   - ერთი component crash აღარ ანადგურებს მთელ SPA-ს

### 🟡 ფაზა 3 — Performance / CLS (~1.5 სთ)

5. **Image width/height** მნიშვნელოვან კომპონენტებზე:
   - `MapPreviewCard`, `MapBottomSheet`, `ServiceCard` thumbnail-ები
   - `LaundryCard`, `DriveCard`, `ChargerCard` (თუ აკლია)
   - CLS დარდება, LCP გაუმჯობესდება

### 🟡 ფაზა 4 — SEO საფარის გავრცობა (~1 სთ)

6. **SEOHead დარჩენილ გვერდებზე**: `Login`, `Register`, `ResetPassword`, `UpdatePassword`, `Book`, `AddService`
   - ყველა noindex (auth/transactional), მაგრამ სუფთა title/canonical

7. **SEO utils consolidation**
   - `seoUtils.ts` და `seoHelpers.ts` ერთ ფაილში გავაერთიანოთ, duplicate-ები ამოვშალოთ
   - ერთი source of truth

### ❌ რას არ ვაკეთებთ ამ ეტაპზე (დიდი სამუშაო, ცალკე გეგმაა)

- **RLS audit** — სრული DB-side policies გადახედვა (1 დღე, ცალკე ფაზად ღირს)
- **Map.tsx-ის სრული refactor** (1,243 → React popups) — 1+ დღე
- **Tests + CI** — დიდი setup, ცალკე გადაწყვეტილება
- **Sentry / Web Vitals** — საჭიროებს account/key-ს თქვენგან
- **PWA icons + offline page** — შესაძლებელია, მაგრამ ცალკე batch
- **115 `any` types** — refactor-ი, არა quick-win
- **Large file splits** (ServiceDetail, MechanicProfile) — refactor-ი

### სავარაუდო შედეგი

- 🔒 XSS დახურული + PII console-დან ამოღებული
- 🛡️ App crash-resistant ErrorBoundary-ით
- 📐 CLS გაუმჯობესება ძირითად ბარათებზე
- 🔍 100% SEOHead coverage საჯარო/auth გვერდებზე
- 🧹 SEO utils-ის ერთიანი ფაილი

**ჯამური დრო:** ~5 საათი მუშაობა, ერთ ჯერზე გავაკეთებ.

თუ თანახმა ხარ, დავიწყებ ფაზა 1-დან. შემდეგ ცალკე გადავწყვიტოთ RLS audit-ი და Map refactor.
