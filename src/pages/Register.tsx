
import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RegisterForm from "@/components/auth/RegisterForm";

const Register = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>რეგისტრაცია | ავტოხელოსანი</title>
        <meta name="description" content="დარეგისტრირდით ავტოხელოსანი.ge-ზე როგორც მომხმარებელი ან ხელოსანი." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://fixup.ge/register" />
      </Helmet>
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
