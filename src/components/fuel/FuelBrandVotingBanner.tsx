import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, X } from "lucide-react";
import { useFuelVoteStats } from "@/hooks/useFuelVoteStats";
import { FuelBrandVotingDialog } from "./FuelBrandVotingDialog";

export const FuelBrandVotingBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: stats, isLoading } = useFuelVoteStats();

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoading || !stats || stats.length === 0) return null;

  const topBrand = stats[0];

  return (
    <>
      <div
        className={`fixed bottom-10 left-4 right-4 md:left-auto md:right-8 md:w-96 z-50 transition-all duration-500 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-32 opacity-0 pointer-events-none"
        }`}
      >
        <Card className="shadow-2xl border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-accent transition-all hover:rotate-90"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h3 className="font-bold text-sm">მომხმარებლის რჩეული</h3>
              <Badge variant="secondary" className="ml-auto">
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                LIVE
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              {topBrand.logo_url ? (
                <img src={topBrand.logo_url} alt={topBrand.brand_name} className="w-12 h-12 object-contain" />
              ) : (
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">⛽</div>
              )}
              <div className="flex-1">
                <p className="font-bold text-lg">{topBrand.brand_name}</p>
                <p className="text-xs text-muted-foreground">{topBrand.vote_count} ხმა</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{topBrand.vote_percentage}%</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)} className="flex-1">
                სრული რეიტინგი
              </Button>
              <Button size="sm" onClick={() => setDialogOpen(true)} className="flex-1">
                ხმის მიცემა
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <FuelBrandVotingDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
};
