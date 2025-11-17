import { useState } from "react";
import { Link } from 'react-router-dom';
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Wrench, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const ResetPassword = () => {
  const { resetPassword, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("გთხოვთ შეიყვანოთ ელ-ფოსტა!");
      return;
    }

    const { error } = await resetPassword(email);

    if (error) {
      // Handle specific error cases with Georgian messages
      let errorMessage = "შეცდომა დაფიქსირდა";

      if (error.message.includes("Invalid") || error.message.includes("not found")) {
        errorMessage = "არასწორი ელ-ფოსტის მისამართი ან მომხმარებელი არ არსებობს";
      } else if (error.message.includes("rate limit")) {
        errorMessage = "ძალიან ბევრი მცდელობა. გთხოვთ სცადოთ რამდენიმე წუთში";
      }

      toast.error(errorMessage);
    } else {
      setIsSubmitted(true);
      toast.success("პაროლის აღდგენის ინსტრუქცია გამოგზავნილია თქვენს ელ-ფოსტაზე!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow flex items-center justify-center bg-muted py-10">
        <div className="container mx-auto px-4">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-auto">
            <div className="flex justify-center mb-6">
              <div className="flex items-center">
                <Wrench className="h-8 w-8 text-secondary mr-2" />
                <span className="text-2xl font-bold text-primary">ავტოხელოსანი</span>
              </div>
            </div>

            {!isSubmitted ? (
              <>
                <h2 className="text-2xl font-bold text-center mb-2">პაროლის აღდგენა</h2>
                <p className="text-center text-muted-foreground mb-6">
                  შეიყვანეთ თქვენი ელ-ფოსტის მისამართი და ჩვენ გამოგიგზავნით პაროლის აღდგენის ინსტრუქციას
                </p>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">ელ-ფოსტა</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="email@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-6 bg-primary hover:bg-primary-light"
                    disabled={loading}
                  >
                    {loading ? 'გაგზავნა...' : 'აღდგენის ინსტრუქციის გაგზავნა'}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="mb-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">შეამოწმეთ თქვენი ელ-ფოსტა</h2>
                <p className="text-muted-foreground mb-6">
                  პაროლის აღდგენის ინსტრუქცია გამოგზავნილია მისამართზე: <strong>{email}</strong>
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  არ მოგიღიათ წერილი? შეამოწმეთ სპამის საქაღალდე ან სცადეთ ხელახლა რამდენიმე წუთში.
                </p>
                <Button
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  className="w-full mb-3"
                >
                  სხვა ელ-ფოსტის გამოყენება
                </Button>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link to="/login" className="inline-flex items-center text-sm text-primary hover:text-primary-light">
                <ArrowLeft size={16} className="mr-1" />
                დაბრუნება შესვლაზე
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ResetPassword;
