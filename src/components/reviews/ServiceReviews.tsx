import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, User } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

interface ServiceReviewsProps {
  serviceId: number;
  onReviewAdded?: () => void;
}

const ServiceReviews = ({ serviceId, onReviewAdded }: ServiceReviewsProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [serviceId]);

  const fetchReviews = async () => {
    console.log("📋 Fetching reviews for service:", serviceId);
    setLoading(true);
    
    try {
      // First fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("service_reviews")
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_id
        `)
        .eq("service_id", serviceId)
        .order("created_at", { ascending: false });

      if (reviewsError) {
        console.error("❌ Error fetching reviews:", reviewsError);
        throw reviewsError;
      }

      console.log("✅ Reviews fetched:", reviewsData);

      // If we have reviews, fetch the associated profile data
      let reviewsWithProfiles: Review[] = [];
      
      if (reviewsData && reviewsData.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(reviewsData.map(review => review.user_id))];
        
        // Fetch profiles for these users
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", userIds);

        if (profilesError) {
          console.error("❌ Error fetching profiles:", profilesError);
          // Continue without profile data
        }

        console.log("👤 Profiles fetched:", profilesData);

        // Combine reviews with profile data
        reviewsWithProfiles = reviewsData.map(review => {
          const profile = profilesData?.find(p => p.id === review.user_id);
          return {
            ...review,
            profiles: profile ? {
              first_name: profile.first_name,
              last_name: profile.last_name,
              avatar_url: profile.avatar_url
            } : undefined
          };
        });
      }

      setReviews(reviewsWithProfiles);

      // Check if current user has already reviewed this service
      if (user) {
        const userReview = reviewsWithProfiles.find(review => review.user_id === user.id);
        setUserHasReviewed(!!userReview);
      }

    } catch (error: any) {
      console.error("❌ Error fetching reviews:", error);
      toast.error("შეფასებების ჩატვირთვისას შეცდომა დაფიქსირდა");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error("შეფასების დასატოვებლად გთხოვთ გაიაროთ ავტორიზაცია");
      return;
    }

    if (newRating < 1 || newRating > 5) {
      toast.error("შეფასება უნდა იყოს 1-დან 5-მდე");
      return;
    }

    console.log("📝 Submitting review:", { serviceId, rating: newRating, comment: newComment });
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("service_reviews")
        .insert({
          service_id: serviceId,
          user_id: user.id,
          rating: newRating,
          comment: newComment.trim() || null,
        });

      if (error) {
        console.error("❌ Error submitting review:", error);
        throw error;
      }

      console.log("✅ Review submitted successfully");
      toast.success("შეფასება წარმატებით დაემატა");
      
      // Reset form
      setNewRating(5);
      setNewComment("");
      setShowReviewForm(false);
      setUserHasReviewed(true);
      
      // Refresh reviews
      await fetchReviews();
      
      // Notify parent component
      if (onReviewAdded) {
        onReviewAdded();
      }

    } catch (error: any) {
      console.error("❌ Error submitting review:", error);
      toast.error("შეფასების დამატებისას შეცდომა დაფიქსირდა");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={() => interactive && onRatingChange && onRatingChange(star)}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>შეფასებები ({reviews.length})</span>
          {user && !userHasReviewed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReviewForm(!showReviewForm)}
            >
              შეფასების დატოვება
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Review Form */}
        {showReviewForm && user && (
          <div className="border rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">შეფასება</label>
              {renderStars(newRating, true, setNewRating)}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">კომენტარი (არასავალდებულო)</label>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="დაწერეთ თქვენი კომენტარი..."
                className="min-h-[100px]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSubmitReview}
                disabled={submitting}
                size="sm"
              >
                {submitting ? "იგზავნება..." : "შეფასების გაგზავნა"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReviewForm(false)}
                size="sm"
              >
                გაუქმება
              </Button>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>ჯერ არ არის შეფასებები</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.profiles?.avatar_url || ""} alt="მომხმარებელი" />
                    <AvatarFallback>
                      {review.profiles?.first_name?.charAt(0) || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-grow space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {review.profiles?.first_name || "უცნობი"} {review.profiles?.last_name || "მომხმარებელი"}
                        </p>
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <span className="text-xs text-gray-500">
                            {new Date(review.created_at).toLocaleDateString('ka-GE')}
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceReviews;
