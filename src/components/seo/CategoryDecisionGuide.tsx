import { Link } from 'react-router-dom';
import type { ServiceType } from '@/hooks/useServices';
import { createServiceSlug } from '@/utils/slugUtils';

const QUESTIONS: Record<string, string[]> = {
  'saqare-minebi': ['ჩანაცვლება გჭირდებათ თუ არსებული მინის შეკეთება?', 'მინაზე კამერა ან სენსორია? დააზუსტეთ კალიბრაციის საჭიროება.', 'მოიცავს შეთავაზება მინას, მონტაჟსა და მასალებს?'],
  'tvlebis-sheqra': ['დააზუსტეთ, საჭიროა თვლების გასწორება თუ საბურავების ბალანსირება.', 'ჰკითხეთ ხელოსანს, ამოწმებს თუ არა სავალ ნაწილს სამუშაოს დაწყებამდე.', 'მოითხოვეთ გაზომვის შედეგები სამუშაომდე და შემდეგ.'],
  'piris-gadakvra': ['სრული გადაკვრა გჭირდებათ თუ კონკრეტული დეტალის?', 'შეადარეთ მასალის ბრენდი, ტიპი და მოსახსნელად საჭირო პირობები.', 'დააზუსტეთ, შედის თუ არა ძველი ფირის მოხსნა ფასში.'],
  'vulkanizatsia': ['სასწრაფო დახმარებისთვის ჯერ დარეკეთ და დაადასტურეთ სამუშაო საათები.', 'გამოძახება და ადგილზე მომსახურება კონკრეტულ ხელოსანთან გადაამოწმეთ.', 'დააზუსტეთ საბურავის ზომა და მოიცავს თუ არა ფასი ბალანსირებას.'],
  'akumulatori': ['აკუმულატორის აღდგენა და ახალი აკუმულატორის შეძენა სხვადასხვა მომსახურებაა.', 'მიუთითეთ ავტომობილის მოდელი, აკუმულატორის ტიპი და ტევადობა.', 'ჰკითხეთ სპეციალისტს, ამოწმებს თუ არა აკუმულატორსა და დამუხტვის სისტემას.'],
  'parebis-aghdgena': ['გაყვითლებული ზედაპირი, დაზიანებული კორპუსი და ელექტრო გაუმართაობა სხვადასხვა სამუშაოა.', 'მოითხოვეთ მსგავსი ფარის რეალური ნამუშევრების ფოტოები.', 'დააზუსტეთ დამცავი საფარი და გარანტიის კონკრეტული პირობები.'],
};

export default function CategoryDecisionGuide({ slug, name, services }: { slug: string; name: string; services: ServiceType[] }) {
  const questions = QUESTIONS[slug];
  if (!questions || !services.length) return null;
  const priced = services.filter(service => typeof service.price_from === 'number' && service.price_from > 0);
  const onsite = services.filter(service => service.on_site_service);
  return <section className="container mx-auto px-4 pb-8" aria-label="მომსახურების არჩევა">
    <h2 className="text-2xl font-bold mb-4">{name} — ფასი და ხელოსნის არჩევა</h2>
    <p className="text-muted-foreground mb-4">{priced.length ? `ნაჩვენებ განცხადებებში მითითებული საწყისი ფასი ${Math.min(...priced.map(service => service.price_from!))}₾-დანაა. საბოლოო თანხა დამოკიდებულია სამუშაოს მოცულობაზე და ხელოსანთან შეთანხმებაზე.` : 'ამ განცხადებებში ფასი წინასწარ შეთანხმებით ზუსტდება. ხელოსანს აუხსენით პრობლემა და მოითხოვეთ სამუშაოსა და მასალების ცალკე შეფასება.'}</p>
    <ul className="list-disc pl-5 space-y-2 mb-4">{questions.map(question => <li key={question}>{question}</li>)}</ul>
    {onsite.length > 0 && <p className="mb-3">ნაჩვენებ განცხადებებში {onsite.length} მომსახურება ადგილზე შესრულების შესაძლებლობას უთითებს.</p>}
    <div className="flex flex-wrap gap-3">{(onsite.length ? onsite : services).slice(0, 3).map(service => <Link className="text-primary underline" key={service.id} to={`/service/${createServiceSlug(service.id, service.name)}`}>{service.name}</Link>)}</div>
  </section>;
}
