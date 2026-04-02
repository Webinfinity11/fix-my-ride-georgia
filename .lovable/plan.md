

# Lazy Loading + Placeholder ოპტიმიზაციის გეგმა

## მიმდინარე მდგომარეობა
- ServiceCard-ს უკვე აქვს `loading="lazy"` და placeholder (ImageOff icon ფოტოს გარეშე)
- ServiceGallery, LaundryCard, BlogCard — აქვთ `loading="lazy"`
- **არ არის** IntersectionObserver-ზე დაფუძნებული lazy loading (blur-up placeholder + viewport-თან მოახლოებისას ჩატვირთვა)
- ბრაუზერის native `loading="lazy"` მუშაობს, მაგრამ არ აჩვენებს placeholder-ს ჩატვირთვისას

## გეგმა

### 1. ახალი კომპონენტი: `LazyImage`
**ფაილი:** `src/components/ui/lazy-image.tsx`

IntersectionObserver-ზე დაფუძნებული კომპონენტი:
- სურათი არ იტვირთება სანამ viewport-ში არ მოხვდება (rootMargin: 200px — წინასწარ, სქროლის მოახლოებისას)
- ჩატვირთვამდე აჩვენებს ნაცრისფერ animated skeleton placeholder-ს (pulse ანიმაცია)
- ჩატვირთვის შემდეგ fade-in ეფექტით გამოჩნდება სურათი
- `priorityImage` prop-ით შესაძლებელია eager ჩატვირთვა (above-the-fold სურათებისთვის)

### 2. კომპონენტების განახლება
შემდეგ კომპონენტებში `<img>` ჩანაცვლდება `<LazyImage>`-ით:

- **ServiceCard** — მთავარი ფოტო (ყველაზე დიდი გავლენა, /services გვერდზე ბევრი ბარათია)
- **ServiceGallery** — thumbnails და მთავარი სურათი
- **LaundryCard** — სარეცხი სურათი
- **BlogCard** — ბლოგის სურათი
- **DriveCard** — drive სურათი
- **FuelImporterCard** — ლოგო

### 3. ტექნიკური დეტალები

```text
┌─────────────────────────┐
│   Viewport              │
│                         │
│  ┌───────────────────┐  │
│  │  Visible cards     │  │  ← სურათები ჩატვირთული
│  │  with images       │  │
│  └───────────────────┘  │
│                         │
├─────────────────────────┤  ← rootMargin: 200px
│  ┌───────────────────┐  │
│  │  Loading zone      │  │  ← იწყებს ჩატვირთვას
│  └───────────────────┘  │
├─────────────────────────┤
│  ┌───────────────────┐  │
│  │  Skeleton          │  │  ← placeholder ჩანს
│  │  placeholder       │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

**LazyImage props:**
- `src`, `alt`, `className` — სტანდარტული
- `width`, `height` — CLS-ის თავიდან ასარიდებლად
- `priority` — true = eager, false = IntersectionObserver
- `placeholderClassName` — skeleton-ის სტილი

## ფაილები
1. **შექმნა:** `src/components/ui/lazy-image.tsx`
2. **განახლება:** `ServiceCard.tsx`, `ServiceGallery.tsx`, `LaundryCard.tsx`, `BlogCard.tsx`, `DriveCard.tsx`, `FuelImporterCard.tsx`

## შედეგი
- სურათები იტვირთება მხოლოდ viewport-თან 200px მოახლოებისას
- Skeleton placeholder ანიმაციით სანამ სურათი ჩაიტვირთება
- Fade-in ეფექტი ჩატვირთვის შემდეგ
- Above-the-fold სურათები (პირველი 2 ServiceCard) კვლავ eager იტვირთება

