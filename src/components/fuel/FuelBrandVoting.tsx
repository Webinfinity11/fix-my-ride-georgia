import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useFuelVoteStats } from "@/hooks/useFuelVoteStats";
import { useUserVote } from "@/hooks/useUserVote";
import { FuelBrandCard } from "./FuelBrandCard";
import { supabase } from "@/integrations/supabase/client";

export const FuelBrandVoting = () => {
  const navigate = useNavigate();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: stats, isLoading: statsLoading } = useFuelVoteStats();
  const { userVote, hasVoted, voteMutation } = useUserVote(user?.id);

  const handleVoteClick = (brandId: string) => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    voteMutation.mutate(brandId);
  };

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">მომხმარებლების რჩეული საწვავის კომპანია</h2>
        <p className="text-muted-foreground">
          აირჩიეთ თქვენთვის სასურველი ბრენდი და მისცით ხმა
        </p>
        {hasVoted && userVote && (
          <p className="text-sm text-primary font-medium">
            ✅ თქვენ ხმა მიეცით: {userVote.brand_name}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ავტორიზაცია საჭიროა</AlertDialogTitle>
            <AlertDialogDescription>
              ხმის მისაცემად გაიარეთ ავტორიზაცია ან დარეგისტრირდით.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/login")}>
              შესვლა / რეგისტრაცია
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
