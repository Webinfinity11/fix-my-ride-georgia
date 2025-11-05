import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, LogIn } from "lucide-react";
import { useFuelVoteStats } from "@/hooks/useFuelVoteStats";
import { useUserVote } from "@/hooks/useUserVote";
import { FuelBrandCard } from "./FuelBrandCard";
import { supabase } from "@/integrations/supabase/client";

interface FuelBrandVotingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FuelBrandVotingDialog = ({
  open,
  onOpenChange,
}: FuelBrandVotingDialogProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: stats, isLoading: statsLoading } = useFuelVoteStats();
  const { userVote, hasVoted, voteMutation } = useUserVote(user?.id);

  const handleVoteClick = (brandId: string) => {
    if (!user) {
      navigate("/login?redirect=/fuel-brands");
      onOpenChange(false);
      return;
    }

    voteMutation.mutate(brandId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-500" />
            <DialogTitle className="text-2xl">
              მომხმარებლების რჩეული საწვავის კომპანია
            </DialogTitle>
          </div>
          <DialogDescription>
            აირჩიეთ თქვენთვის სასურველი ბრენდი და მისცით ხმა
          </DialogDescription>
        </DialogHeader>

        {!user && (
          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <LogIn className="w-4 h-4" />
            <AlertDescription>
              ხმის მისაცემად საჭიროა ავტორიზაცია.{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-semibold"
                onClick={() => {
                  navigate("/login?redirect=/fuel-brands");
                  onOpenChange(false);
                }}
              >
                შესვლა / რეგისტრაცია →
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {hasVoted && userVote && (
          <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <AlertDescription>
              ✅ თქვენ ხმა მიეცით: <strong>{userVote.brand_name}</strong>
            </AlertDescription>
          </Alert>
        )}

        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats?.map((brand) => (
              <FuelBrandCard
                key={brand.brand_id}
                brand={brand}
                onVote={handleVoteClick}
                isVoting={voteMutation.isPending}
                hasVoted={hasVoted}
                userVotedBrandId={userVote?.brand_id || null}
                isAuthenticated={!!user}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
