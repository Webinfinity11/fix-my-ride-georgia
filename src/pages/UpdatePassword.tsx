import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Wrench, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const UpdatePassword = () => {
  const { updatePassword, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.password || !form.confirmPassword) {
      toast.error("გთხოვთ შეავსოთ ყველა ველი!");
      return;
    }

    if (form.password.length < 6) {
      toast.error("პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს!");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("პაროლები არ ემთხვევა!");
      return;
    }

    const { error } = await updatePassword(form.password);

    if (error) {
      toast.error(`პაროლის განახლება ვერ მოხერხდა: ${error.message}`);
    } else {
      toast.success("პაროლი წარმატებით განახლდა!");
      setTimeout(() => {
        navigate('/login');
      }, 1500);
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

            <h2 className="text-2xl font-bold text-center mb-2">ახალი პაროლის დაყენება</h2>
            <p className="text-center text-muted-foreground mb-6">
              შეიყვანეთ თქვენი ახალი პაროლი
            </p>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">ახალი პაროლი</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="მინიმუმ 6 სიმბოლო"
                      required
                      value={form.password}
                      onChange={handleChange}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">გაიმეორეთ პაროლი</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="გაიმეორეთ პაროლი"
                      required
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-6 bg-primary hover:bg-primary-light"
                disabled={loading}
              >
                {loading ? 'მიმდინარეობს...' : 'პაროლის განახლება'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>მინიშნება:</strong> გამოიყენეთ ძლიერი პაროლი, რომელიც შეიცავს ასოებს, ციფრებს და სპეციალურ სიმბოლოებს.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UpdatePassword;
