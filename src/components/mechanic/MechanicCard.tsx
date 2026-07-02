import { useNavigate } from "react-router-dom";
import { MapPin, Star, Phone, BadgeCheck } from "lucide-react";
import { createMechanicSlug } from "@/utils/slugUtils";
import { trackMechanicPhone } from "@/utils/tracking";
import { getOptimizedImageUrl } from "@/utils/imageCompression";

interface MechanicCardProps {
  mechanic: {
    id: string;
    display_id?: number;
    profiles: {
      first_name: string;
      last_name: string;
      city?: string;
      district?: string;
      avatar_url?: string;
      phone?: string;
      is_verified?: boolean;
    };
    specialization?: string;
    hourly_rate?: number;
    rating?: number;
    review_count?: number;
    is_mobile?: boolean;
    working_hours?: any;
  };
}

// Minimal, dependency-light mechanic card (rebuilt from scratch).
export const MechanicCard: React.FC<MechanicCardProps> = ({ mechanic }) => {
  const navigate = useNavigate();
  const p = mechanic.profiles;
  const fullName = `${p.first_name} ${p.last_name}`.trim();
  const initials = `${p.first_name?.charAt(0) || ""}${p.last_name?.charAt(0) || ""}`.toUpperCase();
  const location = [p.city, p.district].filter(Boolean).join(", ") || "მდებარეობა მითითებული არ არის";
  const profileUrl = `/mechanic/${createMechanicSlug(mechanic.display_id || 0, p.first_name, p.last_name)}`;

  const handleCall = () => {
    if (!p.phone) return;
    trackMechanicPhone(mechanic.id);
    window.location.href = `tel:${p.phone}`;
  };

  return (
    <div className="h-full flex flex-col rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        {p.avatar_url ? (
          <img src={getOptimizedImageUrl(p.avatar_url, 120, 120, 70)} alt={fullName} loading="lazy" className="h-14 w-14 rounded-xl object-cover shrink-0 bg-gray-100" />
        ) : (
          <div className="h-14 w-14 rounded-xl bg-primary text-white grid place-items-center text-base font-bold shrink-0">{initials || "?"}</div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[15px] font-bold text-gray-900 truncate">{fullName}</h3>
            {p.is_verified && <BadgeCheck className="h-4 w-4 text-green-600 shrink-0" />}
          </div>
          {mechanic.specialization && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{mechanic.specialization}</p>}
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center gap-1 mt-1.5 text-xs">
            {mechanic.rating ? (
              <>
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-gray-900">{Number(mechanic.rating).toFixed(1)}</span>
                <span className="text-gray-400">({mechanic.review_count || 0})</span>
              </>
            ) : (
              <span className="text-gray-400">ახალი · შეფასების გარეშე</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 flex gap-2">
        <button
          type="button"
          onClick={() => navigate(profileUrl)}
          className="flex-1 h-10 rounded-lg border border-gray-200 text-gray-900 text-[13px] font-semibold hover:border-gray-900 transition-colors"
        >
          დეტალები
        </button>
        {p.phone && (
          <button
            type="button"
            onClick={handleCall}
            className="flex-1 h-10 rounded-lg bg-primary text-white text-[13px] font-bold inline-flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors"
          >
            <Phone className="h-3.5 w-3.5" />დარეკვა
          </button>
        )}
      </div>
    </div>
  );
};

export default MechanicCard;
