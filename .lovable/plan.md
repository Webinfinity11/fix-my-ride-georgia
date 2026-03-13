

# /services ფილტრების UX გამოსწორება

## პრობლემების იდენტიფიკაცია

### 1. სქროლვისას ფილტრები იხსნება
მობილურზე Select dropdown-ებს და Collapsible trigger-ებს `h-12` touch target აქვს. სქროლვისას თითი რომ მოხვდება Select-ზე ან Collapsible trigger-ზე, ის იხსნება. ეს Radix Select-ის ქცევაა — touch start-ზე ამუშავდება.

### 2. ფილტრაციის შემდეგ ფილტრი არ იკეცება
`showFilters` state ყოველთვის `true`-ა (`useState(true)`). ფილტრაცია/ძიება არ ცვლის ამ state-ს.

### 3. ზოგადი UX გაუმჯობესება
ამჟამინდელი ფილტრი ძალიან რთულია მობილურზე: 4 Select dropdown, checkbox, Collapsible brands, nested Collapsible — ეს ყველაფერი ერთდროულად ჩანს.

## გეგმა

### ფაილი 1: `src/components/services/ModernServiceFilters.tsx`
**სრული რედიზაინი მობილურისთვის:**

- **Search bar ყოველთვის ხილული** — მხოლოდ ძიების input და ძიების ღილაკი
- **ფილტრები ჩაკეცილი default-ად** — "ფილტრები" ღილაკზე დაჭერით იხსნება
- **ძიების/ფილტრაციის შემდეგ ავტომატურად იკეცება** — `onSearch` callback-ში `setShowAdvanced(false)` 
- **Select-ებზე touch-move prevention** — `onPointerDown` ნაცვლად click-ის გამოყენება, ან wrapper div-ით `touch-action: manipulation` CSS
- **გამარტივებული layout:** კატეგორია + ქალაქი ერთ row-ში, ბრენდები მთლიანად ცალკე collapsible-ში
- **Active filter chips** — არჩეული ფილტრები ჩანს badge-ებით ფილტრის ქვემოთ, X-ით წაშლადი
- **"გასუფთავება" ღილაკი** მხოლოდ აქტიური ფილტრების დროს

### ფაილი 2: `src/pages/ServicesDetail.tsx`
- `showFilters` default `false`-ზე შეცვლა მობილურზე
- ძიების შემდეგ ფილტრის ავტომატური ჩაკეცვა
- ფილტრების toggle ღილაკზე active filter count badge-ის დამატება

### კონკრეტული UX ცვლილებები:

```text
ამჟამინდელი:                    ახალი:
┌─────────────────┐            ┌─────────────────┐
│ [Search input ] │            │ [Search input ] │
│ კატეგორია ▼     │            │ [🔍 ძიება]      │
│ ქალაქი ▼        │            │                 │
│ რეიტინგი ▼      │            │ [⚙ ფილტრები (2)]│
│ ☐ ადგილზე       │            │                 │
│ [ბრენდები ▼]    │            │  ← დაჭერისას:   │
│  BMW ☐          │            │ კატეგორია ▼      │
│  Mercedes ☐     │            │ ქალაქი ▼        │
│  ...            │            │ ☐ ადგილზე       │
│ [ძიება]         │            │ [ბრენდები ▼]    │
│ [გასუფთავება]   │            │ [გაფილტვრა]     │
└─────────────────┘            │                 │
                               │ არჩეული:        │
                               │ [BMW ×] [ვაკე ×]│
                               └─────────────────┘
```

### Touch scroll fix:
- ფილტრის container-ს `touch-action: pan-y` CSS property
- Select trigger-ებს `data-touch="true"` attribute და CSS `touch-action: manipulation`
- Collapsible trigger-ზე `onTouchMove` handler-ით event cancellation — სქროლვისას არ გაიხსნას

