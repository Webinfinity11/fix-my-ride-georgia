import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { FuelBrandStats } from "@/hooks/useFuelVoteStats";

interface FuelBrandCardProps {
  brand: FuelBrandStats;
  onVote: (brandId: string) => void;
  isVoting: boolean;
  hasVoted: boolean;
  userVotedBrandId: string | null;
  isAuthenticated: boolean;
}

export const FuelBrandCard = ({
  brand,
  onVote,
  isVoting,
  hasVoted,
  userVotedBrandId,
  isAuthenticated,
}: FuelBrandCardProps) => {
  const isUserChoice = userVotedBrandId === brand.brand_id;

  return (
    <Card className={`relative overflow-hidden transition-all hover:shadow-lg ${
      isUserChoice ? 'ring-2 ring-primary' : ''
    }`}>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          {brand.logo_url ? (
            <img 
              src={brand.logo_url} 
              alt={brand.brand_name}
              className="w-16 h-16 object-contain"
            />
          ) : (
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-2xl">⛽</span>
            </div>
          )}
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              {brand.brand_name}
              {isUserChoice && (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              {brand.vote_count} ხმა
            </p>
          </div>
          
          <Badge variant="secondary" className="text-lg font-bold">
            {brand.vote_percentage}%
          </Badge>
        </div>

        <Progress value={brand.vote_percentage} className="h-2" />

        <Button
          onClick={() => onVote(brand.brand_id)}
          disabled={!isAuthenticated || isVoting}
          className="w-full"
          variant={isUserChoice ? "default" : "outline"}
        >
          {!isAuthenticated 
            ? "ავტორიზაცია საჭიროა" 
            : isUserChoice 
            ? "თქვენი არჩევანი" 
            : hasVoted 
            ? "ხმის შეცვლა"
            : "ხმის მიცემა"
          }
        </Button>
      </CardContent>
    </Card>
  );
};
