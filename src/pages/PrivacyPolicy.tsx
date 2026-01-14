import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";

const PrivacyPolicy = () => {
  return (
    <Layout>
      <Helmet>
        <title>კონფიდენციალურობის პოლიტიკა | FixUp</title>
        <meta name="description" content="FixUp აპლიკაციის კონფიდენციალურობის პოლიტიკა - როგორ ვაგროვებთ, ვიყენებთ და ვიცავთ თქვენს ინფორმაციას." />
      </Helmet>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <article className="prose prose-gray dark:prose-invert max-w-none">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            კონფიდენციალურობის პოლიტიკა
          </h1>
          
          <p className="text-muted-foreground mb-8">
            <strong>ბოლო განახლება:</strong> 2026 წლის იანვარი
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">შესავალი</h2>
            <p className="text-muted-foreground leading-relaxed">
              FixUp აპლიკაცია ("ჩვენ", "აპლიკაცია") პატივს სცემს თქვენს კონფიდენციალურობას. 
              ეს პოლიტიკა განმარტავს, როგორ ვაგროვებთ, ვიყენებთ და ვიცავთ თქვენს ინფორმაციას.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">რა მონაცემებს ვაგროვებთ</h2>
            
            <h3 className="text-lg font-medium text-foreground mb-3">მდებარეობის მონაცემები</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>ვიყენებთ თქვენს მდებარეობას რუკაზე ახლომდებარე სერვისების საჩვენებლად</li>
              <li>მდებარეობა მხოლოდ აპლიკაციის გამოყენებისას მუშავდება</li>
              <li>მდებარეობის მონაცემები არ ინახება ჩვენს სერვერებზე</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">რა მონაცემებს არ ვაგროვებთ</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>პერსონალურ ინფორმაციას (სახელი, მეილი, ტელეფონი)</li>
              <li>გადახდის ინფორმაციას</li>
              <li>კონტაქტებს</li>
              <li>ფოტოებს ან ფაილებს</li>
              <li>ბრაუზერის ისტორიას</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">მონაცემთა გაზიარება</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              ჩვენ არ ვყიდით, არ ვაქირავებთ და არ ვუზიარებთ თქვენს მონაცემებს მესამე მხარეებს, 
              გარდა შემდეგი შემთხვევებისა:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>კანონით მოთხოვნილი შემთხვევები</li>
              <li>თქვენი თანხმობით</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">მესამე მხარის სერვისები</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              აპლიკაცია იყენებს შემდეგ სერვისებს:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li><strong>Google Maps</strong> - რუკის ჩვენებისთვის</li>
              <li><strong>Supabase</strong> - მონაცემთა ბაზისთვის</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              ეს სერვისები შეიძლება აგროვებდნენ ანონიმურ ანალიტიკურ მონაცემებს 
              საკუთარი კონფიდენციალურობის პოლიტიკის შესაბამისად.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">მონაცემთა უსაფრთხოება</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>ყველა მონაცემთა გადაცემა დაშიფრულია HTTPS პროტოკოლით</li>
              <li>ვიყენებთ თანამედროვე უსაფრთხოების სტანდარტებს</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">ბავშვთა კონფიდენციალურობა</h2>
            <p className="text-muted-foreground leading-relaxed">
              ჩვენი აპლიკაცია არ არის განკუთვნილი 13 წლამდე ასაკის ბავშვებისთვის 
              და შეგნებულად არ ვაგროვებთ მათ მონაცემებს.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">თქვენი უფლებები</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              თქვენ გაქვთ უფლება:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>უარი თქვათ მდებარეობის გაზიარებაზე (აპლიკაცია იმუშავებს შეზღუდული ფუნქციონალით)</li>
              <li>წაშალოთ აპლიკაცია ნებისმიერ დროს</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">ცვლილებები პოლიტიკაში</h2>
            <p className="text-muted-foreground leading-relaxed">
              ჩვენ შეგვიძლია პერიოდულად განვაახლოთ ეს კონფიდენციალურობის პოლიტიკა. 
              ნებისმიერი ცვლილება გამოქვეყნდება ამ გვერდზე განახლებული თარიღით.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">კონტაქტი</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              თუ გაქვთ კითხვები ამ კონფიდენციალურობის პოლიტიკასთან დაკავშირებით, 
              გთხოვთ დაგვიკავშირდეთ:
            </p>
            <p className="text-muted-foreground">
              <strong>ელ-ფოსტა:</strong>{" "}
              <a 
                href="mailto:info@fixup.ge" 
                className="text-primary hover:underline"
              >
                info@fixup.ge
              </a>
            </p>
          </section>

          <hr className="border-border my-8" />

          <p className="text-center text-muted-foreground text-sm">
            © 2026 FixUp. ყველა უფლება დაცულია.
          </p>
        </article>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;
