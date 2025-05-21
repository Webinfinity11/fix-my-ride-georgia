
import { Search, Calendar, Star } from 'lucide-react';

// Type definition for steps
type Step = {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
};

const steps: Step[] = [
  {
    id: 1,
    title: "მოძებნეთ ხელოსანი",
    description: "გამოიყენეთ ჩვენი საძიებო სისტემა ხელოსნების მოსაძებნად ადგილმდებარეობის, სპეციალიზაციისა და რეიტინგის მიხედვით.",
    icon: <Search className="h-8 w-8" />,
  },
  {
    id: 2,
    title: "დაჯავშნეთ სერვისი",
    description: "აირჩიეთ სასურველი თარიღი და დრო, მიუთითეთ თქვენი ავტომობილის დეტალები და დაადასტურეთ შეკვეთა.",
    icon: <Calendar className="h-8 w-8" />,
  },
  {
    id: 3,
    title: "შეაფასეთ გამოცდილება",
    description: "სერვისის დასრულების შემდეგ, დატოვეთ შეფასება და წაახალისეთ ხარისხიანი მომსახურება.",
    icon: <Star className="h-8 w-8" />,
  },
];

const HowItWorks = () => {
  return (
    <section className="section-padding bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">როგორ მუშაობს</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            სამი მარტივი ნაბიჯით მიიღეთ პროფესიონალური მომსახურება თქვენი მანქანისთვის.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 justify-between relative">
          {/* Connecting line (only on md screens and above) */}
          <div className="hidden md:block absolute top-16 left-0 right-0 h-1 bg-gray-200 z-0"></div>
          
          {steps.map((step, index) => (
            <div key={step.id} className="flex-1 relative z-10" style={{ maxWidth: '100%' }}>
              <div className="flex flex-col items-center text-center">
                {/* Step number with icon */}
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white mb-5 relative">
                  {step.icon}
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-white text-sm font-bold">
                    {step.id}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
