import {useQuery} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {supabase} from '@/integrations/supabase/client';
import {BRAND_PAGES} from '@/utils/carBrands';
import {createServiceSlug} from '@/utils/slugUtils';
import {summarizeDistrictOffers,DISTRICT_SERVICE_GUIDES} from '@/utils/districtCategoryContent';
export default function CategoryDistrictGuide({categoryId,categorySlug,categoryName,district}: {
 categoryId:number;categorySlug:string;categoryName:string;district:{name:string;nameLocative:string};
}) {
 const {data:offers}=useQuery({queryKey:['category-district-guide',categoryId,district.name],queryFn:async()=>{
  const {data,error}=await supabase.from('mechanic_services').select('id,name,price_from,car_brands,on_site_service,mechanic_id').eq('category_id',categoryId).eq('district',district.name).eq('is_active',true).order('id').range(0,4999);
  if(error) throw error;return data;
 },staleTime:1000*60*5});
 if(!offers?.length) return null;
 const stats=summarizeDistrictOffers(offers);
 const guide=DISTRICT_SERVICE_GUIDES[categorySlug];
 const questions=guide?.questions || ['აღწერეთ საჭირო სამუშაო და მიუთითეთ მანქანის მარკა, მოდელი და წელი.','დააზუსტეთ, რა შედის ფასში: სამუშაო, მასალები და ნაწილები.','წინასწარ შეათანხმეთ მისამართი, ვიზიტის დრო და გარანტიის პირობები.'];
 return <section className="container mx-auto px-4 py-8">
  <details className="max-w-4xl mx-auto rounded-lg border bg-card p-5">
   <summary className="cursor-pointer font-semibold text-primary">{categoryName} {district.nameLocative} — ფასები და არჩევის რჩევები · მეტის ნახვა</summary>
   <div className="mt-5 space-y-5 text-muted-foreground">
    <h2 className="text-xl font-bold text-foreground">{guide?.alias || categoryName} {district.nameLocative}</h2>
    <p>{categoryName} {district.nameLocative}: ამ გვერდის კატეგორიასა და უბანს {stats.serviceCount} აქტიური განცხადება შეესაბამება, {stats.providerCount} მიმწოდებლისგან. განცხადებები სამუშაოს ტიპითა და პირობებით შეიძლება განსხვავდებოდეს; გადაამოწმეთ კონკრეტულად თქვენთვის საჭირო მომსახურება.</p>
    <div><h3 className="font-semibold text-foreground">რა ფასი აქვს {categoryName} მომსახურებას {district.nameLocative}?</h3>
     <p>{stats.startingPrice!==null ? `${stats.pricedCount} განცხადებაში მითითებულია საწყისი ფასი; ყველაზე დაბალი მითითებული თანხაა ${stats.startingPrice}₾. ეს კონკრეტული შეთავაზების საწყისი ფასია — საბოლოო თანხა სამუშაოს მოცულობითა და ავტომობილის ვერსიით ზუსტდება.` : 'ამ უბნის შესაბამის განცხადებებში დადებითი საწყისი ფასი მითითებული არ არის. დარეკვისას მოითხოვეთ სამუშაოს, მასალებისა და ნაწილების შეფასება.'}</p>
    </div>
    <div><h3 className="font-semibold text-foreground">რა დავაზუსტო დარეკვისას?</h3><ul className="list-disc pl-5 space-y-2">{questions.map(q=><li key={q}>{q}</li>)}</ul></div>
    <p>{stats.onsiteCount ? `${stats.onsiteCount} განცხადება ადგილზე მომსახურების შესაძლებლობას უთითებს. გამოძახების არეალი და საფასური მიმწოდებელთან დააზუსტეთ.` : 'ადგილზე გამოძახება ამ შეთავაზებებში მონიშნული არ არის. გადაამოწმეთ სერვისის მისამართი და სამუშაო საათები ვიზიტამდე.'}</p>
    {stats.brands.length>0 && <div><h3 className="font-semibold text-foreground">განცხადებებში მითითებული მარკები</h3><div className="flex flex-wrap gap-2 mt-2">{stats.brands.map(b=>{const brand=BRAND_PAGES.find(brand => brand.name === b.name);return brand ? <Link className="text-primary underline" key={b.name} to={`/brand/${brand.slug}`}>{brand.nameKa} ({b.count})</Link> : null;})}</div></div>}
    <div><h3 className="font-semibold text-foreground">ამ უბნის შეთავაზებები</h3><div className="flex flex-wrap gap-3 mt-2">{offers.slice(0,3).map(offer=><Link key={offer.id} className="text-primary underline" to={`/service/${createServiceSlug(offer.id,offer.name)}`}>{offer.name}</Link>)}</div></div>
    <Link className="inline-block text-primary underline" to={`/category/${categorySlug}`}>{categoryName} — ყველა უბნის შეთავაზება</Link>
   </div>
  </details>
 </section>;
}
