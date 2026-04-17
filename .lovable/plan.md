

# iOS App Promotion Popup

## მიზანი
iPhone-ზე საიტის გახსნისას იუზერს ლამაზად შესთავაზოს App Store-დან FixUp-ის ნატივი აპლიკაციის გადმოწერა.

## დიზაინი

```text
┌─────────────────────────────────┐
│  [X]                            │
│                                 │
│   [App Icon]                    │
│                                 │
│   FixUp — Auto Services         │
│   ⭐ ხელმისაწვდომია App Store-ზე │
│                                 │
│   სწრაფი წვდომა, push-ები,      │
│   უკეთესი გამოცდილება           │
│                                 │
│   [  App Store-ზე გადასვლა  ]  │
│                                 │
│   [ მოგვიანებით ]               │
└─────────────────────────────────┘
```

ქვემოდან amომავალი (slide-up) bottom sheet სტილის popup, blur backdrop-ით. მსგავსი როგორც InstallPWA კომპონენტი, მაგრამ მხოლოდ iOS-ზე.

## ლოგიკა

**როდის გამოჩნდეს:**
- მხოლოდ iPhone/iPad (User Agent detection: `/iPad|iPhone|iPod/.test(navigator.userAgent)`)
- არ გამოჩნდეს თუ უკვე native აპლიკაციაშია (`window.navigator.standalone` ან Capacitor environment)
- არ გამოჩნდეს თუ იუზერმა დახურა (localStorage flag: `ios-app-promo-dismissed`)
- 2 წამის დაყოვნებით გამოჩნდეს (არ შეუშალოს თავდაპირველ ჩატვირთვას)
- "მოგვიანებით"-ზე დაჭერისას — 7 დღით დაიმალოს (timestamp localStorage-ში)
- "X"-ზე დაჭერისას — სამუდამოდ დაიმალოს

**App Store ლინკი:**
`https://apps.apple.com/ge/app/fixup-auto-services/id6757795136`

## ფაილები

### 1. შექმნა: `src/components/mobile/IOSAppPromo.tsx`
- iOS detection
- Bottom sheet popup (Sheet კომპონენტიდან ან custom div animate-in slide-from-bottom)
- App icon (favicon ან /lovable-uploads/ logo)
- ქართული ტექსტები
- 2 ღილაკი: "App Store-ზე გადასვლა" (primary) და "მოგვიანებით" (ghost)
- localStorage dismiss logic (X = სამუდამოდ, "მოგვიანებით" = 7 დღე)

### 2. განახლება: `src/App.tsx`
- დაემატოს `<IOSAppPromo />` `<InstallPWA />`-ის გვერდით

## ვიზუალური დეტალები
- z-index: 9998 (InstallPWA-ზე ერთით ზემოთ რომ კონფლიქტი არ იყოს, ან მხოლოდ ერთი ჩანდეს — iOS-ზე InstallPWA-ის დამალვა)
- bottom: 20px მობაილზე (bottom nav-ზე ზემოთ)
- App Store-ის ოფიციალური badge stilshi ღილაკი (შავი background, თეთრი ტექსტი)
- Apple icon (lucide-react-დან არ არის — გამოვიყენოთ SVG ან Smartphone icon)

## მნიშვნელოვანი
iOS-ზე InstallPWA-ს არ აქვს `beforeinstallprompt` event, ამიტომ PWA banner-ი მაინც არ გამოჩნდება — კონფლიქტი არ იქნება. მაგრამ კოდში დავამატებ guard-ს რომ IOSAppPromo iOS-ზე ჩანდეს, InstallPWA კი მხოლოდ Android/Desktop-ზე.

