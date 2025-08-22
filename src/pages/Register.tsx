
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RegisterForm from "@/components/auth/RegisterForm";
import SEOHead from "@/components/seo/SEOHead";
import { generateSEOTitle, generateSEODescription, generateCanonicalURL } from "@/utils/seoUtils";

const Register = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={generateSEOTitle('register', {})}
        description={generateSEODescription('register', {})}
        keywords="რეგისტრაცია, ანგარიშის შექმნა, ავტოხელოსანი"
        canonical={generateCanonicalURL('register', {})}
        type="website"
      />
      <Header />
      
      <main className="flex-grow flex items-center justify-center bg-muted py-10">
        <div className="container mx-auto px-4">
          <RegisterForm />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Register;
