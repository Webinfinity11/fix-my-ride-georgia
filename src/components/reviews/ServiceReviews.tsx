import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Star, User, Check, ArrowRight } from "lucide-react";
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
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [justSent, setJustSent] = useState(false);

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("service_reviews")
        .select(`id, rating, comment, created_at, user_id`)
        .eq("service_id", serviceId)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;

      let reviewsWithProfiles: Review[] = [];
      if (reviewsData && reviewsData.length > 0) {
        const userIds = [...new Set(reviewsData.map((r) => r.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", userIds);

        reviewsWithProfiles = reviewsData.map((review) => {
          const profile = profilesData?.find((p) => p.id === review.user_id);
          return {
            ...review,
            profiles: profile
              ? { first_name: profile.first_name, last_name: profile.last_name, avatar_url: profile.avatar_url }
              : undefined,
          };
        });
      }

      setReviews(reviewsWithProfiles);
      if (user) setUserHasReviewed(reviewsWithProfiles.some((r) => r.user_id === user.id));
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("შეფასებების ჩატვირთვისას შეცდომა დაფიქსირდა");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("შეფასების დასატოვებლად გთხოვთ გაიაროთ ავტორიზაცია");
      return;
    }
    if (rating < 1 || rating > 5) {
      toast.error("აირჩიეთ შეფასება 1-დან 5-მდე");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("service_reviews").insert({
        service_id: serviceId,
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
      });
      if (error) throw error;

      toast.success("შეფასება წარმატებით დაემატა");
      setRating(0);
      setHover(0);
      setComment("");
      setUserHasReviewed(true);
      setJustSent(true);
      await fetchReviews();
      onReviewAdded?.();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("შეფასების დამატებისას შეცდომა დაფიქსირდა");
    } finally {
      setSubmitting(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="rounded-2xl bg-white border border-ink-200/60 p-6">{children}</div>
  );

  if (loading) {
    return shell(
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-ink-100 rounded w-1/4" />
        <div className="h-16 bg-ink-100 rounded" />
        <div className="h-24 bg-ink-100 rounded" />
      </div>
    );
  }

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return shell(
    <>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-ink-400">შეფასებები</div>
        <div className="flex items-center gap-2">
          {avg && (
            <span className="inline-flex items-center gap-1 text-[12px] font-bold text-ink-900">
              <Star className="h-3.5 w-3.5 fill-accent-500 text-accent-500" />{avg}
            </span>
          )}
          <span className="text-[10.5px] font-mono tabular-nums text-ink-400">{reviews.length}</span>
        </div>
      </div>

      {/* Existing reviews */}
      {reviews.length > 0 && (
        <div className="space-y-4 mb-6">
          {reviews.map((r) => {
            const name = `${r.profiles?.first_name || "უცნობი"} ${r.profiles?.last_name || ""}`.trim();
            const initial = r.profiles?.first_name?.charAt(0)?.toUpperCase();
            return (
              <div key={r.id} className="flex items-start gap-3 pb-4 border-b border-ink-100 last:border-0 last:pb-0">
                <div className="h-9 w-9 rounded-full bg-brand-500 text-white grid place-items-center text-[12px] font-bold shrink-0 overflow-hidden">
                  {r.profiles?.avatar_url ? (
                    <img src={r.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : initial ? initial : <User className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[13px] font-bold text-ink-900 truncate">{name}</div>
                    <div className="text-[10.5px] text-ink-400 font-mono tabular-nums shrink-0">
                      {new Date(r.created_at).toLocaleDateString("ka-GE")}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-accent-500 text-accent-500" : "text-ink-300"}`} />
                    ))}
                  </div>
                  {r.comment && <p className="mt-1.5 text-[13px] text-ink-700 leading-relaxed">{r.comment}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leave a review / encourage */}
      {justSent || userHasReviewed ? (
        <div className="text-center py-4">
          <div className="h-11 w-11 rounded-full bg-success-50 border border-success-200 grid place-items-center mx-auto text-success-600">
            <Check className="h-5 w-5" strokeWidth={3} />
          </div>
          <div className="mt-3 text-[14px] font-bold text-ink-900">გმადლობთ შეფასებისთვის!</div>
          <p className="mt-1 text-[11.5px] text-ink-500 leading-relaxed">შენ უკვე შეაფასე ეს სერვისი — მადლობა, რომ ეხმარები სხვა მომხმარებლებს.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-ink-50 border border-ink-200/60 p-4">
          <h3 className="text-[15px] font-bold text-ink-900 leading-snug">
            {reviews.length === 0 ? "იყავი პირველი, ვინც შეაფასებს." : "დატოვე შენი შეფასება."}
          </h3>
          <p className="mt-1 text-[11.5px] text-ink-500 leading-relaxed">
            {reviews.length === 0
              ? "შენი შეფასება დაეხმარება შემდეგ მომხმარებლებს სწორი არჩევანის გაკეთებაში."
              : "გაუზიარე შენი გამოცდილება — ერთი წუთი სჭირდება."}
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-[0.16em] font-bold text-ink-500 mb-1.5 block">შეფასება</label>
              <div className="flex items-center gap-1.5" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => {
                  const active = (hover || rating) >= n;
                  return (
                    <button key={n} type="button" onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} className="p-0.5">
                      <Star className={`h-7 w-7 transition ${active ? "fill-accent-500 text-accent-500" : "text-ink-300 hover:text-ink-400"}`} />
                    </button>
                  );
                })}
                <span className="ml-2 text-[11.5px] font-mono tabular-nums text-ink-500">{hover || rating || "—"} / 5</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.16em] font-bold text-ink-500 mb-1.5 block">კომენტარი</label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="როგორი იყო სამუშაო? რა მოგეწონა?"
                className="w-full px-3 py-2 rounded-field bg-white border border-ink-200 text-[12.5px] focus:outline-none focus:border-ink-900 focus:ring-2 focus:ring-brand-500/20 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={!rating || submitting}
              className={`w-full h-10 rounded-btn text-[12.5px] font-bold inline-flex items-center justify-center gap-2 transition ${
                rating && !submitting ? "bg-brand-500 hover:bg-brand-600 text-white" : "bg-ink-100 text-ink-400 cursor-not-allowed"
              }`}
            >
              {submitting ? "იგზავნება..." : <>გაგზავნა<ArrowRight className="h-3.5 w-3.5" /></>}
            </button>
            {!user && (
              <p className="text-[10.5px] text-ink-500 text-center">
                გასაგზავნად საჭიროა <Link to="/login" className="text-brand-600 font-semibold underline underline-offset-2">ავტორიზაცია</Link>
              </p>
            )}
          </form>
        </div>
      )}
    </>
  );
};

export default ServiceReviews;
