export type DistrictOffer = {
 id: number; name: string; price_from: number | null; car_brands: string[] | null;
 on_site_service: boolean; mechanic_id: string | null;
};
export function summarizeDistrictOffers(offers: DistrictOffer[]) {
 const priced=offers.filter(s=>typeof s.price_from==='number' && Number.isFinite(s.price_from) && s.price_from>0);
 const brands=new Map<string,number>();
 for(const offer of offers) {
  // A listing tagging every brand is not evidence of a specialism.
  if((offer.car_brands?.length || 0)>5) continue;
  for(const brand of new Set(offer.car_brands || [])) brands.set(brand,(brands.get(brand)||0)+1);
 }
 return {
  serviceCount:offers.length,
  providerCount:new Set(offers.map(s=>s.mechanic_id).filter(Boolean)).size,
  pricedCount:priced.length,
  startingPrice:priced.length ? Math.min(...priced.map(s=>s.price_from!)) : null,
  onsiteCount:offers.filter(s=>s.on_site_service).length,
  brands:[...brands].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,count])=>({name,count})),
 };
}
export const DISTRICT_SERVICE_GUIDES: Record<string,{alias:string;questions:string[]}> = {
 'parebis-aghdgena':{alias:'ფარის აღდგენა, ფარების შეკეთება და გასწორება',questions:['მიუთითეთ ფარის დაზიანება: ზედაპირის გაყვითლება, ბზარი, კორპუსი თუ განათების პრობლემა.','ფარების გასწორებას ეძებთ? დააზუსტეთ, ასრულებს თუ არა ხელოსანი სინათლის მიმართულების რეგულირებას.','ჰკითხეთ, შედის თუ არა პოლირება და დამცავი საფარი შეთავაზებულ ფასში.']},
 'saqare-minebi':{alias:'საქარე მინის შეცვლა და შეკეთება',questions:['მიუთითეთ მანქანის მარკა, მოდელი, წელი და მინის დაზიანება.','გაარკვიეთ, საჭიროა შეცვლა თუ შესაძლებელია დაზიანების შეკეთება.','თუ მინაზე კამერა ან სენსორია, დააზუსტეთ მონტაჟისა და კალიბრაციის პირობები.']},
 'diskebis-sheghebvaaghdgena':{alias:'დისკების შეღებვა და აღდგენა',questions:['დააზუსტეთ დისკის ზომა, მასალა და სამუშაო: შეღებვა, გასწორება თუ სხვა დაზიანების აღდგენა.','ჰკითხეთ, ფასი ერთ დისკს ეხება თუ კომპლექტს და შედის თუ არა ძველი საფარის მოხსნა.','შეთანხმდით ფერზე, დასრულების დროზე და გარანტიის პირობებზე.']},
 'sachis-sistema':{alias:'რულავოის ხელოსანი და საჭის სისტემის შეკეთება',questions:['აღწერეთ სიმპტომი: ხმაური, თავისუფალი სვლა, გაჟონვა თუ საჭის დამძიმება.','დააზუსტეთ ავტომობილის მოდელი და საჭის სისტემის ტიპი.','ჰკითხეთ, ასრულებს თუ არა ხელოსანი დიაგნოსტიკას, შეკეთებას ან ნაწილის შეცვლას.']},
 'tvlebis-sheqra':{alias:'რაზვალი და თვლების გასწორება',questions:['თვლების შეყრა და საბურავების ბალანსირება სხვადასხვა სამუშაოა — დააზუსტეთ საჭირო მომსახურება.','ჰკითხეთ, ამოწმებს თუ არა ხელოსანი სავალ ნაწილს გაზომვის დაწყებამდე.','მოითხოვეთ გაზომვის შედეგები სამუშაომდე და შემდეგ.']},
};
