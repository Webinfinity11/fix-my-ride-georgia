
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-sm">
            <h1 className="text-3xl font-bold mb-6">ჩვენს შესახებ</h1>
            
            <p className="mb-4">
              ავტოხელოსანი არის პლატფორმა, რომელიც აკავშირებს ავტომფლობელებს კვალიფიციურ ავტომექანიკოსებთან. ჩვენი მისიაა გავამარტივოთ ავტომობილის მოვლისა და შეკეთების პროცესი.
            </p>
            
            <p className="mb-4">
              ჩვენი პლატფორმა საშუალებას აძლევს მომხმარებლებს:
            </p>
            
            <ul className="list-disc pl-6 mb-6">
              <li className="mb-2">მოძებნონ კვალიფიციური ხელოსნები</li>
              <li className="mb-2">მიიღონ დეტალური ინფორმაცია მათი გამოცდილებისა და სპეციალობების შესახებ</li>
              <li className="mb-2">დაჯავშნონ მომსახურება ონლაინ</li>
              <li className="mb-2">დატოვონ და წაიკითხონ შეფასებები</li>
            </ul>
            
            <h2 className="text-xl font-semibold mb-3">ჩვენი ისტორია</h2>
            <p>
              პლატფორმა შეიქმნა 2025 წელს, როგორც პასუხი მზარდ მოთხოვნაზე გამჭვირვალე და სანდო ავტომობილის შეკეთების სერვისებზე. ჩვენ ვაერთიანებთ ტექნოლოგიას და ავტომობილების შეკეთების ინდუსტრიას, რათა მომხმარებლებს შევუქმნათ უკეთესი გამოცდილება.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
