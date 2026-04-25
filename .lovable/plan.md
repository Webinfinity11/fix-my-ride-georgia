# 🔍 SEO აუდიტი — fixup.ge

შევისწავლე საიტის სტრუქტურა, მეტა ტეგები, structured data, sitemap, performance და technical SEO. ქვემოთ — დეტალური ანგარიში პრიორიტეტების მიხედვით.

---

## ✅ რა მუშაობს კარგად

- **Sitemap-ი ფართოა** — 493 URL, ავტო-განახლებადი (cron job).
- **OG სურათი არსებობს** — სწორი ზომა 1200x630.
- **Structured data** — Organization, LocalBusiness, Service, Product, FAQ, Breadcrumb სქემები გვაქვს.
- **Canonical URLs** — აბსოლუტური `https://fixup.ge` ფორმატით.
- **Performance** — Core Web Vitals ოპტიმიზაცია, lazy loading, WebP კომპრესია უკვე ჩართულია.
- **Mobile responsive** — სრულყოფილი mobile-first მიდგომა.
- **PWA + iOS App** — დაინსტალირებადი app + App Store ლინკი.

---

## 🔴 კრიტიკული პრობლემები (Priority 1)

### 1. **დუბლირებული `<h1>` ტეგები 5 გვერდზე**
Google-ს სურს **მხოლოდ 1 H1** თითოეულ გვერდზე. ჩვენ გვაქვს 2 H1:
- `ServiceDetail.tsx` — "სერვისი ვერ მოიძებნა" + სერვისის სახელი
- `MechanicProfile.tsx` — "ხელოსანი ვერ მოიძებნა" + ხელოსნის სახელი
- `VacancyDetail.tsx`, `ServiceCategory.tsx`, `BlogPost.tsx` — იგივე პატერნი

**გასწორება:** "not found" შეტყობინებები გადავიყვანოთ `<h2>`-ზე ან `<p>`-ზე (რადგან ისინი ერროერ-სთეიტებია).

### 2. **მნიშვნელოვანი გვერდები SEOHead-ის გარეშე**
შემდეგ გვერდებს არ აქვთ SEO მეტა ტეგები:
- `Mechanics.tsx` ❗ (ძირითადი ლისტინგი — კრიტიკული!)
- `Blog.tsx` ❗ (ბლოგის მთავარი გვერდი)
- `BlogPost.tsx` ❗ (ბლოგის სტატიები — დიდი SEO პოტენციალი!)
- `Search.tsx`, `ServiceSearch.tsx`, `ServicesDetail.tsx`
- `AddService.tsx`, `NotFound.tsx` (404 უნდა იყოს noindex)

**გასწორება:** დავამატოთ `<SEOHead>` თითოეულზე უნიკალური title/description-ით.

### 3. **`fullTitle` ფორმატი არასწორია**
`SEOHead.tsx`-ში: `${title} | ავტოხელოსანი` — მაგრამ `generateSEOTitle` უკვე ამატებს `| ავტოხელოსანი`-ს. შედეგად title-ში გვაქვს **ორჯერ "| ავტოხელოსანი"**.

მაგ: `ავტოსერვისები | ავტოხელოსანი | ავტოხელოსანი`

**გასწორება:** SEOHead-ში მოვხსნათ ავტო-suffix-ი ან generateSEOTitle-ში.

---

## 🟠 მნიშვნელოვანი პრობლემები (Priority 2)

### 4. **robots.txt უმართებულობა**
- `Disallow: /chat` ✅ კარგი
- `Allow: /mechanics` მითითებულია, მაგრამ რეალური route არის `/mechanic` (ცალობით). გაურკვევლობა.
- აკლია `Sitemap` რომელიც edge function-ით sertv-დება (`/serve-sitemap`)

### 5. **Alt ტეგები აკლია**
- `FuelStationCard.tsx` — `<img>` ტეგებს alt არ აქვს
- `FuelHero.tsx` — alt აკლია
- `Map.tsx` popup HTML-ში — `<img>` alt-ის გარეშე (Google ბოტი მაინც კითხულობს)

### 6. **`generateSEOTitle('home')` ძალიან გრძელია**
`ავტოხელოსანი - საქართველოს #1 ავტოსერვისების პლატფორმა | ავტოხელოსანი` = **70+ სიმბოლო**.
Google ჭრის 60 სიმბოლოზე. იკარგება ბრენდინგი.

### 7. **Sitemap-ის priority არასწორი დანაწილება**
ყველა service გვერდს აქვს იგივე priority. რეკომენდაცია:
- Homepage: 1.0 ✅
- Services/Mechanics list: 0.9 ✅  
- VIP services: 0.8 (გამოვყოთ)
- რეგულარული services: 0.6
- Blog posts: 0.7 (view_count-ის მიხედვით)

### 8. **OG სურათი ყველგან ერთი და იგივეა**
სერვისის გვერდებზე უნდა გამოჩნდეს სერვისის რეალური ფოტო (Facebook/WhatsApp share-ისას), არა generic ლოგო. `generateServiceOGImage` არსებობს, მაგრამ გადასამოწმებელია მუშაობს თუ არა ყველგან.

---

## 🟡 გასაუმჯობესებელი (Priority 3)

### 9. **Breadcrumb structured data არ არის ყველა გვერდზე**
Index-ზე გვაქვს მხოლოდ "მთავარი" — Google-ს უყვარს უფრო ღრმა breadcrumbs (კატეგორიის გვერდებზე, სერვისის დეტალზე).

### 10. **Internal linking სუსტია**
- Footer-ში არ არის ლინკები კატეგორიებზე (anchor text optimization)
- ბლოგის სტატიებიდან არ ლინკდება შესაბამის სერვისებზე

### 11. **Image SEO**
- სურათების სახელები არ არის descriptive (`5f51074d-...png`)
- WebP კონვერტაცია გვაქვს ✅, მაგრამ width/height attributes აკლია → CLS რისკი

### 12. **Schema.org ვალიდაციის რისკები**
- `OrganizationSchema`-ში `sameAs: []` ცარიელია — დაამატე Facebook/Instagram ლინკები
- `priceValidUntil` Product schema-ში ხელით ვწერთ — შეიძლება აღარ იყოს რელევანტური

### 13. **Meta keywords**
`<meta name="keywords">` Google-მ მიატოვა 2009-დან. შეგვიძლია მოვხსნათ — საზიანო არ არის, მაგრამ უსარგებლოა.

### 14. **404 გვერდი**
`NotFound.tsx` უნდა აბრუნებდეს `noindex` მეტა ტეგს — ახლა Google-ს შეიძლება დაანახოს 200 status + 404 content.

---

## 📋 გასწორების გეგმა (ეტაპობრივი)

### **ფაზა 1: კრიტიკული Quick Wins** (1-2 საათი)
1. **H1 დუბლიკატების მოშორება** — 5 ფაილში "not found" → `<h2>` ან `<div>`
2. **SEOHead დამატება** კრიტიკულ გვერდებზე:
   - `Mechanics.tsx`, `Blog.tsx`, `BlogPost.tsx`, `Search.tsx`
3. **Title duplication ფიქსი** — `SEOHead.tsx`-ში `fullTitle` ლოგიკა
4. **robots.txt გასწორება** — `/mechanics` → `/mechanic`, sitemap entries

### **ფაზა 2: Schema & Meta გაძლიერება** (2-3 საათი)
5. **Alt ტეგების დამატება** — FuelStationCard, FuelHero, Map popups
6. **Home title შემოკლება** — 60 სიმბოლომდე
7. **404 noindex** — NotFound გვერდზე
8. **OrganizationSchema sameAs** — სოციალური ქსელების ლინკები
9. **BlogPost SEO** — სრული SEOHead + BlogPosting structured data + view_count-ით priority

### **ფაზა 3: Sitemap & Internal Linking** (2 საათი)
10. **Sitemap priority ლოგიკა** — VIP services 0.8, regular 0.6, blog 0.7
11. **Footer-ში ტოპ კატეგორიები** — anchor text-ებით internal linking
12. **Breadcrumbs** — ყველა შიდა გვერდზე (კატეგორიები, სერვისები, ბლოგი)

### **ფაზა 4: Performance & Image SEO** (1-2 საათი)
13. **width/height image attributes** — CLS prevention
14. **OG image dynamic generation** გადამოწმება — სერვისებისთვის რეალური ფოტო
15. **Meta keywords მოშორება** ან გაწმენდა

---

## 🎯 მოსალოდნელი შედეგი

| მეტრიკა | ახლა | გასწორების შემდეგ |
|---------|------|------------------|
| Lighthouse SEO score | ~85 | **95-100** |
| Indexable pages | ~493 | 493 + სწორი priority |
| Rich results eligibility | ნაწილობრივი | სრული (Service, Product, Article) |
| CTR Search Results-ში | საშუალო | **+15-25%** (უკეთესი titles/descriptions) |
| Mobile usability | კარგი | სრულყოფილი |

---

## ❓ რას გავაკეთოთ პირველ რიგში?

გთავაზობთ **დავიწყოთ ფაზა 1-ით** (კრიტიკული Quick Wins) — ერთ ცვლილებაში გავაკეთებ H1 ფიქსებს, SEOHead-ის დამატებას მნიშვნელოვან გვერდებზე, title duplication-ის გასწორებას და robots.txt-ს. ეს მოიტანს ყველაზე დიდ SEO სარგებელს მინიმალური დროით.

შემდეგ შემიძლია გადავიდე ფაზა 2-ზე და ა.შ. — ან თუ გინდა სხვა თანმიმდევრობით / მხოლოდ კონკრეტული პუნქტები — მითხარი.
