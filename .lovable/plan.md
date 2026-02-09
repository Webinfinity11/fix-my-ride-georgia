
# 4 თასქის იმპლემენტაციის გეგმა

---

## თასქი 1: ქალაქების ფილტრი მთავარ გვერდზე

**პრობლემა:** `SimplifiedSearch.tsx` ქალაქებს იღებს `cities` ცხრილიდან, მაგრამ ეს ცხრილი ცარიელია ან არ შეიცავს სწორ მონაცემებს. რეალურად სერვისები დამატებულია 6 ქალაქში: ბათუმი, ზუგდიდი, თბილისი, მცხეთა, რუსთავი, ქუთაისი.

**გადაწყვეტა:** ქალაქების წამოღება `mechanic_services` ცხრილიდან (DISTINCT city), სადაც რეალურად სერვისებია დამატებული.

**ფაილი:** `src/components/home/SimplifiedSearch.tsx`
- `cities` ცხრილის ნაცვლად query შეიცვლება: `supabase.from("mechanic_services").select("city").not("city", "is", null)` და შემდეგ unique ქალაქების ამორჩევა.

---

## თასქი 2: კატეგორიების აიკონები

**პრობლემა:** ბაზაში 39 კატეგორიაა, მაგრამ `CategoryCarousel.tsx`-ში მხოლოდ 14 კატეგორიას აქვს აიკონი მინიჭებული. დანარჩენებს დეფაულტად Hammer (ჩაქუჩი) უჩანს.

**გადაწყვეტა:** ყველა 39 კატეგორიას მიენიჭება შესაბამისი Lucide აიკონი, ხოლო დეფაულტი შეიცვლება Hammer-დან Settings-ზე (გადაცემათა კოლოფი).

**ფაილი:** `src/components/home/CategoryCarousel.tsx`
- `categoryIcons` mapping გაფართოვდება ყველა კატეგორიისთვის
- Default icon: `Settings` (გადაცემათა კოლოფი) ნაცვლად `Hammer`-ისა
- ახალი აიკონები მაგალითად:
  - "ვულკანიზაცია" -> CircleDot
  - "ზეთის შეცვლა" -> Droplets
  - "სათუნუქე სამუშაოები" -> Hammer
  - "ფარების აღდგენა" -> Lightbulb
  - "ქიმწმენდა" -> Sparkles
  - "ჰიბრიდული სისტემა" -> Leaf
  - და ა.შ.

---

## თასქი 3: /services გვერდზე ბანერი

**პრობლემა:** /services გვერდზე არ არის რეალური საბანერე პოზიცია, რომელიც ადმინ პანელიდან იმართება.

**გადაწყვეტა:**

1. **ახალი ბანერის პოზიცია ბაზაში:** `services_page` პოზიციის დამატება `site_banners` ცხრილის `position` ველის ტიპში.

2. **ახალი კომპონენტი:** `src/components/banners/ServicesPageBanner.tsx` - ანალოგიური `HomeCenterBanner`-ის:
   - Fixed პოზიცია ქვემოთ, ცენტრში
   - სქროლზე გამოჩნდება
   - დახურვის ღილაკი
   - 730x90 ზომა
   - ადმინიდან ატვირთული სურათი

3. **ადმინ პანელის განახლება:**
   - `BannerManagement.tsx`-ში position select-ში ახალი ოფცია: `services_page`
   - `useSiteBanners.ts` ტიპის განახლება

4. **Services.tsx-ში ინტეგრაცია:** `ServicesPageBanner` კომპონენტის დამატება.

---

## თასქი 4: რუკის ტაბების თანმიმდევრობის შეცვლა

**პრობლემა:** ამჟამინდელი თანმიმდევრობა: სერვისები, სამრეცხაოები, დრაივები, ელ.დამტენები, სადგურები

**სასურველი თანმიმდევრობა:** სერვისები, ელ.დამტენები, სადგურები, სამრეცხაოები, დრაივები

**ფაილი:** `src/pages/Map.tsx` (ხაზები 963-986)
- TabsTrigger ელემენტების გადაწყობა: services -> chargers -> stations -> laundries -> drives

---

## ტექნიკური დეტალები

### შესაცვლელი ფაილები

| ფაილი | ცვლილება |
|-------|---------|
| `src/components/home/SimplifiedSearch.tsx` | ქალაქების fetch logic |
| `src/components/home/CategoryCarousel.tsx` | აიკონების mapping გაფართოება + default icon |
| `src/components/banners/ServicesPageBanner.tsx` | ახალი კომპონენტი (HomeCenterBanner-ის ანალოგი) |
| `src/hooks/useSiteBanners.ts` | position type-ში `services_page` დამატება |
| `src/components/dashboard/admin/BannerManagement.tsx` | ახალი პოზიციის ოფცია |
| `src/pages/Services.tsx` | ბანერის კომპონენტის ინტეგრაცია |
| `src/pages/Map.tsx` | ტაბების თანმიმდევრობის შეცვლა |
| Supabase migration | `site_banners` position check constraint განახლება |
