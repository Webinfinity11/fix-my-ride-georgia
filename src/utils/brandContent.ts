/**
 * Per-brand SEO copy for /brand/:slug pages.
 *
 * Uniqueness matters here: the specialist *listings* already differ per brand,
 * but the prose must not read as a name-swapped template or Google treats the
 * cluster as doorway pages. So each brand carries a real editorial angle
 * (import origin, typical faults, systems that need a specialist), and the top
 * brands get fully hand-written overrides.
 *
 * Resolution: BRAND_OVERRIDES[name] ?? template built from BRAND_ANGLE[slug].
 */

import type { FAQItem } from '@/utils/categoryContent';
import type { BrandInfo } from '@/utils/carBrands';

const a = (href: string, text: string) =>
  `<a href="${href}" class="text-primary hover:underline font-medium">${text}</a>`;

type Angle = {
  /** One-line origin/positioning used in the opening paragraph. */
  origin: string;
  /** Brand-typical concerns a good specialist handles — drives the middle paragraph. */
  faults: string;
  /** Systems/services worth a deep link, as [label, href]. */
  links: Array<[string, string]>;
};

// Genuinely brand-specific angles (not name-swaps). American marques dominate
// Georgia's US-auction market; German cars are electronics-heavy; Japanese are
// reliability/hybrid; EVs need battery specialists.
const BRAND_ANGLE: Record<string, Angle> = {
  ford:          { origin: 'ამერიკული ბაზრიდან, ხშირად Copart/IAAI აუქციონებით შემოსული', faults: 'ავტომატური გადაცემათა კოლოფი, EcoBoost ძრავის ტაიმინგი, ელექტროფიქსაცია', links: [['დიაგნოსტიკა', '/category/diagnostika'], ['ზეთის შეცვლა', '/category/zetis-shecvla']] },
  lincoln:       { origin: 'ამერიკული პრემიუმ სეგმენტიდან, US-აუქციონებით შემოსული', faults: 'ჰაერის დაკიდება (air suspension), ელექტრონიკა, კლიმატ-კონტროლი', links: [['დიაგნოსტიკა', '/category/diagnostika']] },
  chevrolet:     { origin: 'ამერიკული ბაზრიდან, US-აუქციონებით ფართოდ წარმოდგენილი', faults: 'ავტომატური კოლოფი, ტაიმინგის ჯაჭვი, ელექტროსისტემა', links: [['დიაგნოსტიკა', '/category/diagnostika']] },
  buick:         { origin: 'ამერიკული ბაზრიდან შემოსული', faults: 'ძრავის ტაიმინგი, გადაცემათა კოლოფი, სავენტილაციო სისტემა', links: [['დიაგნოსტიკა', '/category/diagnostika']] },
  cadillac:      { origin: 'ამერიკული პრემიუმ ბაზრიდან, US-აუქციონებით', faults: 'Magnetic Ride დაკიდება, ელექტრონიკა, დიდი მოცულობის ძრავები', links: [['დიაგნოსტიკა', '/category/diagnostika']] },
  gmc:           { origin: 'ამერიკული, ჯიპებისა და პიკაპების სეგმენტიდან', faults: 'დიზელის/ბენზინის დიდი ძრავები, ტრანსმისია, სავალი ნაწილი', links: [['სავალი ნაწილის შეკეთება', '/category/savali-natsili']] },
  toyota:        { origin: 'იაპონური, საიმედოობით ცნობილი', faults: 'ჰიბრიდული სისტემა, ტაიმინგი, სავალი ნაწილი', links: [['დიაგნოსტიკა', '/category/diagnostika'], ['ზეთის შეცვლა', '/category/zetis-shecvla']] },
  lexus:         { origin: 'იაპონური პრემიუმ ბრენდი (Toyota-ს პრემიუმ ხაზი)', faults: 'ჰიბრიდული სისტემა, ელექტრონიკა, ხმაურის იზოლაცია', links: [['დიაგნოსტიკა', '/category/diagnostika']] },
  'mercedes-benz': { origin: 'გერმანული პრემიუმ ბრენდი', faults: 'რთული ელექტრონიკა, AIRMATIC დაკიდება, ინჟექტორები', links: [['დიაგნოსტიკა', '/category/diagnostika']] },
  audi:          { origin: 'გერმანული პრემიუმ ბრენდი (VW ჯგუფი)', faults: 'quattro ტრანსმისია, TFSI ძრავის ტაიმინგი, ელექტრონიკა', links: [['დიაგნოსტიკა', '/category/diagnostika']] },
  volkswagen:    { origin: 'გერმანული ბრენდი, ფართოდ გავრცელებული', faults: 'DSG კოლოფი, TSI ტაიმინგის ჯაჭვი, ელექტრონიკა', links: [['დიაგნოსტიკა', '/category/diagnostika']] },
  opel:          { origin: 'გერმანული/ევროპული ბრენდი', faults: 'ძრავის ტაიმინგი, ელექტროფიქსაცია, სავალი ნაწილი', links: [['დიაგნოსტიკა', '/category/diagnostika']] },
  skoda:         { origin: 'ჩეხური ბრენდი VW-ს პლატფორმაზე', faults: 'DSG კოლოფი, TSI ძრავი, ელექტრონიკა', links: [['დიაგნოსტიკა', '/category/diagnostika']] },
  kia:           { origin: 'კორეული ბრენდი, ფასი-ხარისხის კარგი თანაფარდობით', faults: 'ტაიმინგის ჯაჭვი, ავტომატური კოლოფი, ელექტროსისტემა', links: [['ზეთის შეცვლა', '/category/zetis-shecvla']] },
  hyundai:       { origin: 'კორეული ბრენდი, ფართოდ გავრცელებული', faults: 'ტაიმინგი, GDI ძრავები, ავტომატური კოლოფი', links: [['ზეთის შეცვლა', '/category/zetis-shecvla']] },
  tesla:         { origin: 'ამერიკული ელექტრომობილების ბრენდი', faults: 'მაღალი ძაბვის ბატარეა, ელექტროძრავა, პროგრამული დიაგნოსტიკა', links: [['დიაგნოსტიკა', '/category/diagnostika']] },
};

export type BrandOverride = { intro?: string; faq?: FAQItem[] };

// Hand-written premium copy for the highest-volume brands.
export const BRAND_OVERRIDES: Record<string, BrandOverride> = {
  Ford: {
    intro: `
<p><strong>ფორდის ავტოსერვისი საქართველოში</strong> — ერთ-ერთი ყველაზე მოთხოვნადი მიმართულებაა. ფორდი (Ford) ქართულ ბაზარზე ძირითადად ამერიკული აუქციონებიდან (Copart, IAAI) შემოდის, ამიტომ მისი შეკეთება მოითხოვს ხელოსანს, რომელიც იცნობს US-სპეციფიკის თავისებურებებს — მარცხენა საჭიდან სენსორებამდე.</p>
<p>FixUp-ის ${a('/brand/ford', 'ფორდის სპეციალისტები')} მუშაობენ ისეთ დამახასიათებელ საკითხებზე, როგორიცაა <strong>EcoBoost ძრავის ტაიმინგი, ავტომატური გადაცემათა კოლოფი და ელექტროფიქსაცია</strong>. ბევრი მათგანი გთავაზობთ ${a('/category/diagnostika', 'კომპიუტერულ დიაგნოსტიკას')} ორიგინალი პროგრამული უზრუნველყოფით.</p>
<p>თითო ხელოსანი გადის ვერიფიკაციას, ხოლო ფასები, შეფასებები და ნამუშევრების ფოტოები ღიად ჩანს — ჯავშანი კი ონლაინ კეთდება.</p>
    `.trim(),
    faq: [
      { q: 'ვინ არის ფორდის კარგი ხელოსანი თბილისში?', a: 'FixUp-ზე ფორდის სპეციალისტები გამოცალკევებულია — ესენი ის ხელოსნები არიან, რომლებიც კონკრეტულ მარკებზე მუშაობენ, არა „ყველა მარკაზე". ნახეთ მათი შეფასებები, ფასები და წინა ნამუშევრები.' },
      { q: 'რატომ სჭირდება ფორდს სპეციალისტი?', a: 'ამერიკული ფორდები ხშირად US-სპეციფიკისაა — განსხვავებული სენსორები, პროგრამული უზრუნველყოფა და ნაწილების კატალოგი. სპეციალისტმა იცის სად შეუკვეთოს ორიგინალი ან ანალოგი ნაწილი.' },
      { q: 'რა ღირს ფორდის დიაგნოსტიკა?', a: 'ფასი დამოკიდებულია სამუშაოს სირთულეზე. FixUp-ზე თითო ხელოსანი უთითებს ფასს — შეგიძლიათ შეადაროთ და აირჩიოთ.' },
    ],
  },
  Toyota: {
    intro: `
<p><strong>ტოიოტას ავტოსერვისი</strong> — ტოიოტა (Toyota) მსოფლიოში საიმედოობით ცნობილი ბრენდია, თუმცა სწორი მოვლა და დროული სერვისი მისი რესურსის შენარჩუნების გასაღებია. განსაკუთრებით ეს ეხება ${a('/brand/toyota', 'ჰიბრიდულ მოდელებს')}, სადაც ბატარეისა და ინვერტორის მდგომარეობა სპეციალისტის ხელს მოითხოვს.</p>
<p>ტოიოტას სპეციალისტები FixUp-ზე მუშაობენ <strong>ჰიბრიდულ სისტემაზე, ტაიმინგზე, სავალ ნაწილსა და ${a('/category/zetis-shecvla', 'ზეთის შეცვლაზე')}</strong>. მრავალი მათგანი იცნობს ტოიოტას სპეციფიკურ დიაგნოსტიკურ პროტოკოლებს.</p>
<p>ყველა ხელოსანი ვერიფიცირებულია — ფასები, შეფასებები და ჯავშანი ხელმისაწვდომია ონლაინ.</p>
    `.trim(),
    faq: [
      { q: 'ვინ არემონტებს ტოიოტას ჰიბრიდს თბილისში?', a: 'FixUp-ზე ტოიოტას სპეციალისტებს შორის არიან ხელოსნები, რომლებიც კონკრეტულად ჰიბრიდულ სისტემებზე მუშაობენ — ბატარეის დიაგნოსტიკიდან ინვერტორის შეკეთებამდე.' },
      { q: 'რამდენად ხშირად სჭირდება ტოიოტას სერვისი?', a: 'ზეთისა და ფილტრების შეცვლა ჩვეულებრივ 10,000–15,000 კმ-ში, თუმცა ჰიბრიდულ მოდელებს დამატებით სჭირდებათ ბატარეისა და გაგრილების სისტემის შემოწმება.' },
      { q: 'როგორ ვიპოვო კარგი ტოიოტას ხელოსანი?', a: 'ნახეთ სპეციალისტების სია ამ გვერდზე — ყველა ვერიფიცირებულია, აქვს შეფასებები და ღია ფასები.' },
    ],
  },
};

/** Brand intro HTML — hand-written override or a brand-specific template. */
export function getBrandIntro(brand: BrandInfo, specialistCount: number): string {
  const override = BRAND_OVERRIDES[brand.name]?.intro;
  if (override) return override;

  const angle = BRAND_ANGLE[brand.slug];
  const originSentence = angle
    ? `${brand.nameKa} (${brand.name}) — ${angle.origin} მარკაა.`
    : `${brand.nameKa} (${brand.name}) — ერთ-ერთი მოთხოვნადი მარკაა ქართულ ბაზარზე.`;
  const faultSentence = angle
    ? `${brand.nameKaGen} სპეციალისტები ხშირად მუშაობენ ისეთ საკითხებზე, როგორიცაა <strong>${angle.faults}</strong>.`
    : `${brand.nameKaGen} სპეციალისტები მუშაობენ ძრავის, ტრანსმისიისა და ელექტროსისტემის სრულ სპექტრზე.`;
  const linkSentence = angle && angle.links.length
    ? `ბევრი მათგანი გთავაზობთ ${angle.links.map(([l, h]) => a(h, l)).join(', ')}-ს.`
    : '';

  return `
<p><strong>${brand.nameKaGen} ავტოსერვისი საქართველოში.</strong> ${originSentence} FixUp-ზე გამოცალკევებულია ${specialistCount} სპეციალისტი ხელოსანი, რომლებიც სწორედ ${brand.nameKa} მარკაზე მუშაობენ — არა „ყველა მარკაზე".</p>
<p>${faultSentence} ${linkSentence}</p>
<p>თითო ხელოსანი გადის ვერიფიკაციას — ფასები, შეფასებები და ნამუშევრების ფოტოები ღიად ჩანს, ჯავშანი კი ონლაინ კეთდება.</p>
  `.trim();
}

/** Brand FAQ — hand-written override or a brand-specific template. */
export function getBrandFAQ(brand: BrandInfo): FAQItem[] {
  const override = BRAND_OVERRIDES[brand.name]?.faq;
  if (override) return override;

  const angle = BRAND_ANGLE[brand.slug];
  return [
    {
      q: `ვინ არის ${brand.nameKaGen} კარგი ხელოსანი?`,
      a: `FixUp-ზე ${brand.nameKaGen} სპეციალისტები გამოცალკევებულია — ესენი ხელოსნები არიან, რომლებიც კონკრეტულ მარკებზე მუშაობენ, არა „ყველა მარკაზე". ნახეთ მათი შეფასებები, ფასები და წინა ნამუშევრები.`,
    },
    {
      q: `რატომ სჭირდება ${brand.nameKa} მარკას სპეციალისტი?`,
      a: angle
        ? `${brand.nameKa} მოითხოვს ხელოსანს, რომელიც იცნობს მისთვის დამახასიათებელ საკითხებს — ${angle.faults}. სპეციალისტმა იცის სად შეუკვეთოს სწორი ნაწილი და როგორ ჩაატაროს დიაგნოსტიკა.`
        : `სპეციალიზებული ხელოსანი იცნობს ${brand.nameKa} მარკის დამახასიათებელ ტექნიკურ თავისებურებებს და ნაწილების კატალოგს.`,
    },
    {
      q: `შემიძლია ${brand.nameKaGen} სერვისის ონლაინ ჯავშანი?`,
      a: `დიახ. FixUp-ზე თითო ხელოსანთან შეგიძლიათ ნახოთ ფასი, შეფასებები და მოახდინოთ ონლაინ ჯავშანი პირდაპირ პლატფორმიდან.`,
    },
  ];
}
