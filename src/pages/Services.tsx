
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ServiceCategories from "@/components/home/ServiceCategories";

const Services = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="bg-muted py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold mb-6 text-center">ჩვენი სერვისები</h1>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              აღმოაჩინეთ ჩვენი მრავალფეროვანი სერვისები ავტომობილებისთვის. ჩვენ გთავაზობთ მაღალი ხარისხის მომსახურებას სხვადასხვა საჭიროებისთვის.
            </p>
          </div>
        </div>
        
        {/* სერვისების კატეგორიების კომპონენტი */}
        <ServiceCategories />
      </main>
      
      <Footer />
    </div>
  );
};

export default Services;
