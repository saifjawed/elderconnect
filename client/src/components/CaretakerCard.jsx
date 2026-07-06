import {
  MapPin,
  Briefcase,
  Languages as LanguagesIcon,
  BadgeCheck,
  CalendarCheck,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StarRating from "@/components/StarRating";

const SERVICE_GRADIENTS = [
  "from-teal-500 to-emerald-600",
  "from-blue-500 to-indigo-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-purple-500 to-fuchsia-600",
  "from-sky-500 to-cyan-600",
];

const pickGradient = (seed) => {
  if (!seed) return SERVICE_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return SERVICE_GRADIENTS[Math.abs(hash) % SERVICE_GRADIENTS.length];
};

const CaretakerCard = ({ caretaker, onBook, onViewProfile }) => {
  const navigate = useNavigate();
  if (!caretaker) return null;

  const user = caretaker.user || {};
  const firstName = user.firstName || "Caretaker";
  const lastName = user.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const initials =
    `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "CT";
  const avatarSeed = caretaker._id || user._id || fullName;
  const gradient = pickGradient(avatarSeed);

  const rating = Number(caretaker.rating) || 0;
  const totalReviews = caretaker.totalReviews || 0;
  const hourlyRate = Number(caretaker.hourlyRate) || 0;
  const experience = Number(caretaker.experience) || 0;

  const services = Array.isArray(caretaker.services) ? caretaker.services : [];
  const languages = Array.isArray(caretaker.languages) ? caretaker.languages : [];
  const cities = Array.isArray(caretaker.cities) ? caretaker.cities : [];
  const primaryCity = cities[0] || user?.address?.city || "—";

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(caretaker);
      return;
    }
    const userId = user._id || user.id || caretaker.user;
    if (userId) {
      navigate(`/caretakers/${userId}`);
    }
  };

  const handleBook = () => {
    if (onBook) {
      onBook(caretaker);
    } else {
      const userId = user._id || user.id || caretaker.user;
      if (userId) {
        navigate(`/caretakers/${userId}/book`);
      }
    }
  };

  return (
    <Card className="group relative overflow-hidden border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`}
        aria-hidden="true"
      />
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <Avatar className="h-16 w-16 ring-2 ring-white shadow-md">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <AvatarFallback className="text-base">{initials}</AvatarFallback>
              )}
            </Avatar>
            {caretaker.isVerified && (
              <span
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow ring-2 ring-white"
                title="Verified caretaker"
                aria-label="Verified caretaker"
              >
                <BadgeCheck className="h-4 w-4" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-gray-900">
                  {fullName}
                </h3>
                <Badge variant="default" className="mt-1">
                  Caretaker
                </Badge>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <StarRating rating={rating} size="sm" />
              <span className="text-xs text-gray-500">
                {rating.toFixed(1)} ({totalReviews}{" "}
                {totalReviews === 1 ? "review" : "reviews"})
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 px-3 py-2">
          <div>
            <p className="text-xs text-gray-500">Hourly rate</p>
            <p className="text-xl font-bold text-teal-700">
              ₹{hourlyRate}
              <span className="text-sm font-medium text-gray-500">/hr</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Experience</p>
            <p className="text-base font-semibold text-gray-900">
              {experience} {experience === 1 ? "yr" : "yrs"}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-start gap-2 text-gray-600">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-teal-600" aria-hidden="true" />
            <span className="truncate">{primaryCity}</span>
          </div>
          <div className="flex items-start gap-2 text-gray-600">
            <Briefcase className="h-4 w-4 mt-0.5 shrink-0 text-teal-600" aria-hidden="true" />
            <span className="truncate">
              {services.length > 0
                ? `${services.length} service${services.length === 1 ? "" : "s"} offered`
                : "Services coming soon"}
            </span>
          </div>
          {languages.length > 0 && (
            <div className="flex items-start gap-2 text-gray-600">
              <LanguagesIcon className="h-4 w-4 mt-0.5 shrink-0 text-teal-600" aria-hidden="true" />
              <span className="truncate">{languages.join(", ")}</span>
            </div>
          )}
        </div>

        {services.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {services.slice(0, 4).map((service) => (
              <Badge key={service} variant="info">
                {service}
              </Badge>
            ))}
            {services.length > 4 && (
              <Badge variant="secondary">+{services.length - 4}</Badge>
            )}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleViewProfile}
          >
            <Eye className="h-4 w-4" />
            View Profile
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={handleBook}
          >
            <CalendarCheck className="h-4 w-4" />
            Book Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CaretakerCard;
