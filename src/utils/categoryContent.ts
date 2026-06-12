/**
 * Category landing page content — DB override OR template fallback.
 *
 * Every category gets meaningful body copy on day one without an admin
 * having to fill 39 rows of seo_intro by hand. The template uses the
 * category name and live service stats (price range, count) so each page
 * stays unique enough for Google to index it on its own merits.
 *
 * If `seo_intro` / `seo_faq` etc. are populated in the DB, those win.
 */

export type CategorySeoData = {
  seo_intro?: string | null;
  seo_faq?: FAQItem[] | null;
  seo_meta_title?: string | null;
  seo_meta_description?: string | null;
};

export type FAQItem = { q: string; a: string };

export type CategoryStats = {
  name: string;
  serviceCount: number;
  priceMin?: number | null;
  priceMax?: number | null;
  cities?: string[]; // unique cities where this category has services
};

const formatPrice = (n: number): string => `${n.toLocaleString('ka-GE')}₾`;

const formatPriceRange = (min?: number | null, max?: number | null): string => {
  if (!min && !max) return 'ფასი დამოკიდებულია სამუშაოს მოცულობაზე';
  if (min && max && min !== max) return `${formatPrice(min)} – ${formatPrice(max)}`;
  if (min) return `დან ${formatPrice(min)}`;
  if (max) return `მდე ${formatPrice(max)}`;
  return '';
};

/** Title used in <title> tag and OG. */
export function getCategoryMetaTitle(stats: CategoryStats, dbOverride?: string | null): string {
  if (dbOverride && dbOverride.trim()) return dbOverride;
  const count = stats.serviceCount;
  if (count > 0) return `${stats.name} თბილისში — ${count} ხელოსანი | FixUp`;
  return `${stats.name} — ავტოსერვისები საქართველოში | FixUp`;
}

/** Description used in <meta description> and OG. */
export function getCategoryMetaDescription(stats: CategoryStats, dbOverride?: string | null): string {
  if (dbOverride && dbOverride.trim()) return dbOverride;
  const priceText = formatPriceRange(stats.priceMin, stats.priceMax);
  const count = stats.serviceCount;
  const tail = priceText ? ` ფასები: ${priceText}.` : '';
  return `${stats.name} თბილისში, ბათუმსა და სხვა ქალაქებში. ${count}+ ვერიფიცირებული ხელოსანი, რეალური შეფასებები, სამართლიანი ფასები.${tail}`;
}

/**
 * Long-form intro for the body of the category page (HTML, multiple paragraphs).
 * Falls back to template if `dbOverride` empty.
 */
export function getCategoryIntro(stats: CategoryStats, dbOverride?: string | null): string {
  if (dbOverride && dbOverride.trim()) return dbOverride;

  const name = stats.name;
  const count = stats.serviceCount;
  const priceText = formatPriceRange(stats.priceMin, stats.priceMax);
  const citiesText = stats.cities && stats.cities.length > 0
    ? stats.cities.slice(0, 5).join(', ')
    : 'თბილისი, ბათუმი, ქუთაისი';

  return `
<p>${name} — ერთ-ერთი ყველაზე ხშირად მოთხოვნადი სერვისია საქართველოს ავტომფლობელებისთვის. დროული ${name} არა მხოლოდ თქვენი მანქანის სიცოცხლისუნარიანობას უზრუნველყოფს, არამედ უსაფრთხო და კომფორტული მართვის გარანტიაა გრძელვადიან პერსპექტივაში.</p>

<p>FixUp-ის პლატფორმაზე იპოვით <strong>${count}+ ვერიფიცირებულ ხელოსანს</strong>, რომლებიც გთავაზობენ ${name} სერვისს ${citiesText} და სხვა ქართულ ქალაქებში. ყოველი ხელოსანი გადის შემოწმებას, ხოლო მათი მუშაობის ხარისხი ფასდება რეალური მომხმარებლების მიერ.</p>

${priceText ? `<p><strong>ფასები:</strong> ${name} საქართველოში ჯდება ${priceText}. ფასი დამოკიდებულია მანქანის მოდელზე, დაზიანების სიდიდეზე და გამოყენებული ნაწილების ხარისხზე.</p>` : ''}
  `.trim();
}

/** Template "what's included" bullets — universal but framed per category. */
export function getCategoryHighlights(stats: CategoryStats): string[] {
  return [
    'უფასო პირველადი დიაგნოსტიკა და კონსულტაცია',
    'გამოცდილი მექანიკოსები მრავალწლიანი სტაჟით',
    'ხარისხიანი ნაწილები ცნობილი ბრენდებისგან',
    'გარანტია შესრულებულ სამუშაოზე',
    'სამართლიანი და გამჭვირვალე ფასები',
    'სწრაფი მომსახურება — დროის დაკარგვის გარეშე',
  ];
}

/** Template tips for choosing the right mechanic. */
export function getCategoryTips(stats: CategoryStats): string[] {
  return [
    'შეადარეთ რამდენიმე ხელოსნის ფასი — ფიქსაფზე ნახავთ ფასებს ერთ ეკრანზე',
    'წაიკითხეთ მომხმარებლების შეფასებები — განსაკუთრებით ცუდი მიმოხილვები',
    'შეამოწმეთ ხელოსნის გამოცდილება და სპეციალიზაცია',
    'მოითხოვეთ წერილობითი გარანტია შესრულებულ სამუშაოზე',
    'არ აიჩქაროთ — საუკეთესო ფასი არ ნიშნავს საუკეთესო ხარისხს',
  ];
}

/** Universal template FAQ — overridden by DB seo_faq if present. */
export function getCategoryFAQ(stats: CategoryStats, dbOverride?: FAQItem[] | null): FAQItem[] {
  if (dbOverride && Array.isArray(dbOverride) && dbOverride.length > 0) {
    return dbOverride;
  }
  const name = stats.name;
  const priceText = formatPriceRange(stats.priceMin, stats.priceMax);
  return [
    {
      q: `რამდენი ჯდება ${name} საქართველოში?`,
      a: priceText
        ? `${name} ფასი იწყება ${priceText}-დან. ფასი დამოკიდებულია მანქანის მოდელზე, დაზიანების სიდიდეზე და გამოყენებული ნაწილების ხარისხზე. FixUp-ზე იპოვით ხელოსნებს ყველა ბიუჯეტისთვის.`
        : `${name} ფასი დამოკიდებულია მანქანის მოდელზე და დაზიანების სიდიდეზე. FixUp-ზე იპოვით ხელოსნებს ყველა ბიუჯეტისთვის — შეადარეთ ფასები ერთ ეკრანზე.`,
    },
    {
      q: `როგორ ვიპოვო კარგი ხელოსანი ${name}-სთვის?`,
      a: `FixUp-ის პლატფორმაზე ყველა ხელოსანი გადის ვერიფიკაციას. შეგიძლიათ ნახოთ მათი შეფასებები, წინა მუშაობის ფოტოები, ფასები და ჯავშანი ონლაინ მოახდინოთ. ასევე ხელმისაწვდომია სრული ფილტრები: ქალაქი, რეიტინგი, მანქანის ბრენდი.`,
    },
    {
      q: `რა გარანტიას ვიღებთ?`,
      a: `ვერიფიცირებული ხელოსნები გვაძლევენ წერილობით გარანტიას შესრულებულ სამუშაოზე — ჩვეულებრივ 3-დან 12 თვემდე, რემონტის სახეობის მიხედვით. დეტალები აისახება ჯავშანში.`,
    },
    {
      q: `შემიძლია წინასწარ ჯავშანი?`,
      a: `დიახ. FixUp-ის პლატფორმაზე შეგიძლიათ აირჩიოთ თარიღი და დრო ხელოსანთან ვიზიტისთვის. ჯავშანი ხდება სწრაფად და უფასოდ — გადახდა ხდება მხოლოდ მომსახურების მიღების შემდეგ.`,
    },
    {
      q: `მუშაობს თუ არა ${name} ხელოსანი ადგილზე გამოძახებით?`,
      a: `ბევრი ხელოსანი გთავაზობთ ადგილზე გამოძახების სერვისს. ფილტრში მონიშნეთ "ადგილზე სერვისი" და ნახეთ ვინ აქვს ეს ვარიანტი ხელმისაწვდომი.`,
    },
  ];
}
