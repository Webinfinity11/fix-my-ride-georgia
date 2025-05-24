import { useAuth } from "@/context/AuthContext";
import MechanicStats from "./MechanicStats";

const MechanicDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary mb-2">ხელოსნის პანელი</h1>
        <p className="text-muted-foreground">მართეთ თქვენი სერვისები და ჯავშნები</p>
      </div>

      <MechanicStats />
      
      <div className="p-6 bg-muted rounded-lg">
        <p className="text-lg mb-4">გამარჯობა, {user?.firstName}!</p>
        <p>
          კეთილი იყოს თქვენი მობრძანება თქვენს პირად კაბინეტში. აქედან შეგიძლიათ მართოთ
          თქვენი პროფილი, სერვისები, პორტფოლიო და ჯავშნები.
        </p>
      </div>
    </div>
  );
};

export default MechanicDashboard;
