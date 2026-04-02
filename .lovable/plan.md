
# სურათების ოპტიმიზაცია — 17,772 KiB დაზოგვა

## პრობლემა
PageSpeed აჩვენებს 17,772 KiB დაზოგვის პოტენციალს:
- სურათები იტვირთება ორიგინალი ზომით (4000x3000, ~4MB თითო)
- JPEG ფორმატია, WebP-ზე გადაყვანით 60-80% დაზოგვაა
- Supabase-ის `?width=400` პარამეტრები არ მუშაობს (Pro plan სჭირდება)

## გადაწყვეტა — 2 მიმართულება

### 1. ატვირთვისას კომპრესია + WebP კონვერსია (ძირითადი)

**ახალი ფაილი: `src/utils/imageCompression.ts`**
- Canvas API-ით სურათის რესაიზი (max 1200px სიგანე)
- WebP ფორმატში კონვერტაცია (quality: 0.8)
- ფაილის ზომის 80-90% შემცირება (4MB → 200-400KB)

**`src/components/forms/PhotoUpload.tsx` — განახლება:**
- ატვირთვამდე `compressImage()` გამოძახება
- ფაილის extension-ის `.webp`-ზე შეცვლა
- Content-type: `image/webp`

### 2. ServiceCard-ში render endpoint-ის გამოყენება

**`src/components/services/ServiceCard.tsx`:**
- URL-ში `/object/public/` → `/render/image/public/` ჩანაცვლება (Supabase-ის transform endpoint)
- `format=webp` პარამეტრის დამატება
- ეს ახალი ატვირთვების + ძველი სურათების WebP-ზე კონვერტაციას უზრუნველყოფს

### 3. ServiceGallery და ServiceDetail-ში იგივე ცვლილებები

**`src/components/services/ServiceGallery.tsx`:**
- დეტალურ გვერდზეც render endpoint + WebP ფორმატი

## რას ცვლის

| | ადრე | შემდეგ |
|---|---|---|
| ახალი ფოტოები | JPEG 4000x3000, ~4MB | WebP 1200px, ~200KB |
| ძველი ფოტოები | JPEG ორიგინალი | WebP via render endpoint |
| ჯამური დაზოგვა | — | ~17MB (90%+) |

## ფაილები
1. `src/utils/imageCompression.ts` — ახალი (კომპრესიის utility)
2. `src/components/forms/PhotoUpload.tsx` — ატვირთვისას კომპრესია
3. `src/components/services/ServiceCard.tsx` — render endpoint + WebP
4. `src/components/services/ServiceGallery.tsx` — render endpoint + WebP
