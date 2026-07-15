import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CalendarCheck,
  Clock,
  Globe,
  Languages as LanguagesIcon,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Star,
  UserX,
  AlertCircle,
  Award,
} from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/contexts/useAuth";
import { useChat } from "@/contexts/ChatContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import StarRating from "@/components/StarRating";
import Navbar from "@/components/Navbar";
import MapPicker from "@/components/MapPicker";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const formatTime12h = (time) => {
  if (!time || typeof time !== "string") return "";
  const match = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!match) return time;
  let hours = Number(match[1]);
  const minutes = match[2];
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${ampm}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

const ProfileSkeleton = () => (
  <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="h-24 w-24 animate-pulse rounded-full bg-gray-200" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-1/2 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </CardContent>
    </Card>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-60 animate-pulse rounded-xl bg-gray-100" />
      </div>
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
      </div>
    </div>
  </div>
);

const NotFoundState = ({ onBack }) => (
  <div className="mx-auto max-w-2xl px-4 py-24 text-center">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
      <UserX className="h-8 w-8 text-gray-500" />
    </div>
    <h2 className="mt-4 text-2xl font-bold text-gray-900">Caretaker not found</h2>
    <p className="mt-2 text-gray-600">
      We couldn't find this caretaker. They may have deactivated their profile.
    </p>
    <div className="mt-6 flex justify-center gap-3">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Back to search
      </Button>
    </div>
  </div>
);

const ReviewItem = ({ review }) => {
  const customer = review.customer || {};
  const firstName = customer.firstName || "Customer";
  const lastName = customer.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "C";
  const rating = Number(review.rating) || 0;

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          {customer.avatar ? (
            <img src={customer.avatar} alt={fullName} className="h-full w-full object-cover" />
          ) : (
            <AvatarFallback>{initials}</AvatarFallback>
          )}
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate">{fullName}</p>
            <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <StarRating rating={rating} size="sm" />
            <span className="text-xs text-gray-500">{rating.toFixed(1)}</span>
          </div>
          {review.comment && (
            <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap break-words">
              {review.comment}
            </p>
          )}
        </div>
      </div>
    </article>
  );
};

const CaretakerProfilePage = () => {
  const { caretakerUserId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openChatWith } = useChat();

  const [profile, setProfile] = useState(null);
  const [reviewsData, setReviewsData] = useState({ reviews: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!caretakerUserId) return;
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const profileRes = await api.get(`/caretakers/${caretakerUserId}/profile`);
        if (cancelled) return;
        setProfile(profileRes.data);

        try {
          const reviewsRes = await api.get(`/reviews/caretaker/${caretakerUserId}`, {
            params: { limit: 20 },
          });
          if (cancelled) return;
          const payload = reviewsRes.data;
          if (payload && Array.isArray(payload.reviews)) {
            setReviewsData(payload);
          } else if (Array.isArray(payload)) {
            setReviewsData({ reviews: payload, pagination: null });
          } else {
            setReviewsData({ reviews: [], pagination: null });
          }
        } catch {
          if (cancelled) return;
          // Reviews endpoint requires auth; show profile without reviews
          setReviewsData({ reviews: [], pagination: null });
        }
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          setError(
            err.response?.data?.message ||
              "Unable to load this caretaker right now. Please try again later."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [caretakerUserId]);

  const accountUser = profile?.user || {};
  const firstName = accountUser.firstName || "Caretaker";
  const lastName = accountUser.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Caretaker";
  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "C";

  const rating = Number(profile?.rating) || 0;
  const totalReviews = Number(profile?.totalReviews) || 0;
  const hourlyRate = Number(profile?.hourlyRate) || 0;
  const experience = Number(profile?.experience) || 0;
  const bio = profile?.bio || "";
  const services = Array.isArray(profile?.services) ? profile.services : [];
  const certifications = Array.isArray(profile?.certifications)
    ? profile.certifications.filter(Boolean)
    : [];
  const languages = Array.isArray(profile?.languages) ? profile.languages : [];
  const cities = Array.isArray(profile?.cities) ? profile.cities : [];
  const availability = useMemo(
    () => profile?.availability || {},
    [profile]
  );
  const isVerified = Boolean(profile?.isVerified);

  const reviewsList = Array.isArray(reviewsData.reviews) ? reviewsData.reviews : [];
  const reviewCountLabel =
    totalReviews > 0
      ? `${rating.toFixed(1)} (${totalReviews} ${totalReviews === 1 ? "review" : "reviews"})`
      : "No reviews yet";

  const availableDays = useMemo(() => {
    return DAYS.filter(({ key }) => availability[key]?.available);
  }, [availability]);

  const canBook = !user || user.role === "Customer" || user.role === "Admin";

  const handleBook = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!canBook) {
      navigate("/dashboard");
      return;
    }
    navigate(`/caretakers/${caretakerUserId}/book`);
  };

  const handleMessage = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    openChatWith(accountUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {loading ? (
          <ProfileSkeleton />
        ) : notFound ? (
          <NotFoundState onBack={() => navigate("/search")} />
        ) : !profile ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
            <p className="mt-3 text-sm text-red-700">{error || "Unable to load profile."}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/search")}
            >
              Back to search
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Card className="border-gray-200 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-teal-500 to-emerald-600" aria-hidden="true" />
              <CardContent className="p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="relative shrink-0">
                    <Avatar className="h-24 w-24 ring-2 ring-white shadow-md sm:h-28 sm:w-28">
                      {accountUser.avatar ? (
                        <img
                          src={accountUser.avatar}
                          alt={fullName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                      )}
                    </Avatar>
                    {isVerified && (
                      <span
                        className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow ring-2 ring-white"
                        title="Verified caretaker"
                        aria-label="Verified caretaker"
                      >
                        <BadgeCheck className="h-5 w-5" />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h1 className="text-2xl font-bold text-gray-900 truncate">{fullName}</h1>
                          {isVerified && (
                            <Badge variant="success">
                              <BadgeCheck className="h-3 w-3" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600">Professional Caretaker</p>

                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2">
                            <StarRating rating={rating} size="md" />
                            <span className="text-sm font-medium text-gray-700">
                              {reviewCountLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-xs text-gray-500">Hourly rate</p>
                        <p className="text-2xl font-bold text-teal-700">
                          ₹{hourlyRate}
                          <span className="text-sm font-medium text-gray-500">/hr</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button onClick={handleBook} disabled={!canBook}>
                        <CalendarCheck className="h-4 w-4" />
                        {user ? "Book Now" : "Sign in to Book"}
                      </Button>
                      <Button variant="outline" onClick={handleMessage}>
                        <MessageSquare className="h-4 w-4" />
                        Message
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-6 md:col-span-2">
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg">About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bio ? (
                      <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                        {bio}
                      </p>
                    ) : (
                      <p className="text-sm italic text-gray-500">
                        This caretaker hasn't written a bio yet.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {services.length > 0 && (
                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Services offered</CardTitle>
                      <CardDescription>
                        Types of care this caretaker provides
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {services.map((service) => (
                          <Badge key={service} variant="info">
                            <Briefcase className="h-3 w-3" />
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {certifications.length > 0 && (
                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg">Certifications</CardTitle>
                      <CardDescription>Professional credentials</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {certifications.map((cert, idx) => (
                          <li
                            key={`${cert}-${idx}`}
                            className="flex items-start gap-2 text-sm text-gray-700"
                          >
                            <Award className="h-4 w-4 mt-0.5 shrink-0 text-teal-600" aria-hidden="true" />
                            <span>{cert}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-teal-600" />
                      Reviews
                    </CardTitle>
                    <CardDescription>
                      {totalReviews > 0
                        ? `${totalReviews} review${totalReviews === 1 ? "" : "s"} from families`
                        : "Be the first to leave a review"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {reviewsList.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
                        <Star className="mx-auto h-8 w-8 text-gray-300" />
                        <p className="mt-2 text-sm text-gray-500">
                          No reviews yet for this caretaker.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reviewsList.map((review) => (
                          <ReviewItem
                            key={review._id || `${review.customer?._id}-${review.createdAt}`}
                            review={review}
                          />
                        ))}
                        {reviewsData.pagination &&
                          reviewsData.pagination.pages > 1 && (
                            <p className="pt-2 text-xs text-gray-500 text-center">
                              Showing {reviewsList.length} of {reviewsData.pagination.total} reviews
                            </p>
                          )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-base">At a glance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Briefcase className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                      <span>
                        <span className="font-semibold">{experience}</span>{" "}
                        {experience === 1 ? "year" : "years"} of experience
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Globe className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                      <span>
                        <span className="font-semibold">{languages.length}</span>{" "}
                        {languages.length === 1 ? "language" : "languages"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                      <span>
                        <span className="font-semibold">{availableDays.length}</span>{" "}
                        {availableDays.length === 1 ? "day" : "days"} available / week
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {cities.length > 0 && (
                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-teal-600" />
                        Service areas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5">
                        {cities.map((city) => (
                          <Badge key={city} variant="secondary">
                            {city}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {accountUser.address?.coordinates?.lat && accountUser.address?.coordinates?.lng && (
                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-teal-600" />
                        Location
                      </CardTitle>
                      <CardDescription>
                         {accountUser.address.city ? `${accountUser.address.city}, ${accountUser.address.state || ""}` : "Caretaker location"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <MapPicker
                        lat={accountUser.address.coordinates.lat}
                        lng={accountUser.address.coordinates.lng}
                        readOnly={true}
                      />
                    </CardContent>
                  </Card>
                )}

                {languages.length > 0 && (
                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <LanguagesIcon className="h-4 w-4 text-teal-600" />
                        Languages
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1.5">
                        {languages.map((lang) => (
                          <li key={lang} className="text-sm text-gray-700">
                            {lang}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-teal-600" />
                      Weekly schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5 text-sm">
                      {DAYS.map(({ key, label }) => {
                        const day = availability[key];
                        const available = Boolean(day?.available);
                        return (
                          <li
                            key={key}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="text-gray-700">{label}</span>
                            {available ? (
                              <span className="text-xs font-medium text-emerald-700">
                                {formatTime12h(day.start)} – {formatTime12h(day.end)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">Unavailable</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>

                {(accountUser.email || accountUser.phone) && (
                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-teal-600" />
                        Contact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {accountUser.email && (
                        <a
                          href={`mailto:${accountUser.email}`}
                          className="flex items-center gap-2 text-gray-700 hover:text-teal-700 transition-colors"
                        >
                          <Mail className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                          <span className="truncate">{accountUser.email}</span>
                        </a>
                      )}
                      {accountUser.phone && (
                        <a
                          href={`tel:${accountUser.phone}`}
                          className="flex items-center gap-2 text-gray-700 hover:text-teal-700 transition-colors"
                        >
                          <Phone className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                          <span>{accountUser.phone}</span>
                        </a>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <div className="pt-2 text-center">
              <Button variant="ghost" asChild={false} onClick={() => navigate("/search")}>
                <Link to="/search">Browse more caretakers</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaretakerProfilePage;
