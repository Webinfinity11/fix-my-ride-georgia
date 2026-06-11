## პასუხები შენს კითხვებზე

**1. რატომ 15 მექანიკოსი?** DB-ში 241 მექანიკოსია (`profiles.role='mechanic'`), მაგრამ მხოლოდ 15 აქვს `is_verified=true`. ფუნქცია ფილტრით იღებდა მხოლოდ ვერიფიცირებულებს. ✅ შენი არჩევანი: ყველა (245 `mechanic_profiles` row) ჩავსვათ.

**2. /map ქვე-გვერდები არ იყო საიტმაპში.** App.tsx-ში `/map/:tab` მარშრუტი არსებობს და 5 უნიკალური ტაბი აქვს (`/map/services`, `/map/chargers`, `/map/stations`, `/map/laundries`, `/map/drives`), თითოეულს უნიკალური SEO title/description Map.tsx-ში. ✅ დაემატება.

**3. სერვისები:** 529 აქტიური, 529-ვე საიტმაპშია — სრულად ✓.

**4. სტრუქტურა:** ✅ RankMath-სტილით 4 child sitemap-ად დავყოფთ.

---

## იმპლემენტაციის გეგმა — RankMath-style Split Sitemap

### ფაილების სტრუქტურა (Google + RankMath სტანდარტი)

```
fixup.ge/sitemap.xml              ← INDEX (entry point Google-სთვის)
  ├── sitemap-static.xml          ← სტატიკური + /map ტაბები + 39 კატეგორია (~62 URL)
  ├── sitemap-services.xml        ← 529 სერვისის გვერდი + image sitemap
  ├── sitemap-mechanics.xml       ← ყველა 245 მექანიკოსი
  └── sitemap-content.xml         ← 3 ბლოგი (cover image-ით) + 24 ვაკანსია
```

**სულ ~870 URL** (15 → 245 mechanics; +5 /map tabs; +blog images)

### Priority ლოგიკა

| ტიპი | Priority წესი |
|---|---|
| სერვისები — Super VIP | 0.95 |
| სერვისები — VIP | 0.85 |
| სერვისები — Regular | 0.75 |
| მექანიკოსი — verified + ★4.5+ | 0.85 |
| მექანიკოსი — verified + ★4.0+ | 0.75 |
| მექანიკოსი — verified | 0.65 |
| მექანიკოსი — unverified | 0.50 (ახალი) |
| ბლოგი — 1000+ views | 0.80 |
| Map ტაბები (chargers, stations) | 0.75 |

### კონკრეტული ცვლილებები

**1. `supabase/functions/generate-sitemap/index.ts`** — სრული refactor:
- პარალელური query-ები (Promise.all) — სიჩქარე
- მექანიკოსების `.eq('is_verified', true)` ფილტრის წაშლა
- 4 ცალკე XML string ბილდი
- ბლოგებზე `featured_image` დამატება image sitemap-ში
- /map sub-tabs სტატიკურ ფაილში
- სტორიჯში 6 ფაილის ატვირთვა: `sitemap.xml` (index), `sitemap-index.xml` (alias), + 4 child

**2. `scripts/generate-sitemap.mjs`** — იგივე ლოგიკის mirror Node-ში (`public/`-ში წერს build-ის დროს)

**3. `public/robots.txt`** — ერთი `Sitemap:` ხაზი (sitemap.xml = ინდექსი)

**4. `src/components/dashboard/admin/SitemapManagement.tsx`** — UI breakdown გაფართოება (4 ფაილის ცალკე სტატისტიკა, download dropdown)

### Google-სტანდარტის შესაბამისობა

| სტანდარტი | სტატუსი |
|---|---|
| `<sitemapindex>` + child `<urlset>` | ✓ (RankMath pattern) |
| `xmlns:image` namespace | ✓ (services + blog) |
| Absolute URLs (https://fixup.ge) | ✓ |
| UTF-8 + XML escape | ✓ |
| Real `lastmod` from DB | ✓ |
| ≤50,000 URL/file, ≤50MB | ✓ (max 529) |
| robots.txt-ში reference | ✓ |
| Storage + static dual delivery | ✓ |

### Deploy ნაბიჯები (build-mode-ში)

1. ფაილების ჩაწერა (4 ფაილი)
2. Edge function auto-deploy
3. მანუალური ერთჯერადი გაშვება ადმინ პანელიდან (ან curl) → 6 ფაილი storage-ში
4. Build run → 6 ფაილი public/-ში
5. Google Search Console-ში `sitemap.xml`-ის resubmit

### Verification (გავუშვი მე)

- `curl https://fixup.ge/sitemap.xml` → უნდა აჩვენოს sitemapindex
- `curl https://fixup.ge/sitemap-mechanics.xml | grep -c "<url>"` → ~245
- `curl https://fixup.ge/sitemap-services.xml | grep -c "<url>"` → ~529

---

**მზად ვარ — Build mode-ში გადადი და დავიწყოთ.**
