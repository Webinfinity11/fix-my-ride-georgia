
import { useAuth } from "@/context/AuthContext";

const CustomerDashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">მთავარი გვერდი</h1>
      <div className="p-6 bg-muted rounded-lg">
        <p className="text-lg mb-4">გამარჯობა, {user?.firstName}!</p>
        <p>
          კეთილი იყოს თქვენი მობრძანება თქვენს პირად კაბინეტში. აქედან შეგიძლიათ მართოთ
          თქვენი პროფილი, ავტომობილები და ჯავშნები.
        </p>
      </div>
    </div>
  );
};

export default CustomerDashboard;
