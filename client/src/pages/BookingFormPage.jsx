import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Calendar,
  CalendarCheck,
  Check,
  Clock,
  Loader2,
  Lock,
  MapPin,
  StickyNote,
  User as UserIcon,
  Users,
} from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/contexts/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import StarRating from "@/components/StarRating";
import Navbar from "@/components/Navbar";
import MapPicker from "@/components/MapPicker";

const SERVICE_OPTIONS = [
  "Health Check-up",
  "Companionship",
  "Meal Preparation",
  "Mobility Assistance",
  "Medication Management",
  "Errands",
];

// Demo elders used when the customer doesn't yet have linked elder accounts.
// In a real flow this would be derived from a `/api/users/me/elders` endpoint.
const SAMPLE_ELDERS = [
  {
    _id: "demo-elder-1",
    firstName: "Margaret",
    lastName: "Wilson",
    relation: "Mother",
    address: {
      street: "742 Evergreen Terrace",
      city: "San Francisco",
      state: "CA",
      zipCode: "94110",
    },
  },
  {
    _id: "demo-elder-2",
    firstName: "Harold",
    lastName: "Wilson",
    relation: "Father",
    address: {
      street: "742 Evergreen Terrace",
      city: "San Francisco",
      state: "CA",
      zipCode: "94110",
    },
  },
];

const STEPS = [
  { id: 1, title: "Review" },
  { id: 2, title: "Details" },
  { id: 3, title: "Confirm" },
];

const parseTimeToMinutes = (time) => {
  if (typeof time !== "string") return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};

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

const todayIsoDate = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const computeDurationHours = (start, end) => {
  const startMin = parseTimeToMinutes(start);
  const endMin = parseTimeToMinutes(end);
  if (startMin === null || endMin === null || endMin <= startMin) return 0;
  return (endMin - startMin) / 60;
};

const computeTotal = (rate, start, end) => {
  const hours = computeDurationHours(start, end);
  return Math.round((Number(rate) || 0) * hours * 100) / 100;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const CaretakerSummary = ({ profile }) => {
  const user = profile?.user || {};
  const firstName = user.firstName || "Caretaker";
  const lastName = user.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "C";
  const rating = Number(profile?.rating) || 0;
  const totalReviews = Number(profile?.totalReviews) || 0;
  const hourlyRate = Number(profile?.hourlyRate) || 0;
  const services = Array.isArray(profile?.services) ? profile.services : [];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative shrink-0">
        <Avatar className="h-16 w-16 ring-2 ring-white shadow-md">
          {user.avatar ? (
            <img src={user.avatar} alt={fullName} className="h-full w-full object-cover" />
          ) : (
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          )}
        </Avatar>
        {profile?.isVerified && (
          <span
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow ring-2 ring-white"
            title="Verified"
            aria-label="Verified caretaker"
          >
            <BadgeCheck className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-lg font-semibold text-gray-900">{fullName}</h3>
          {profile?.isVerified && (
            <Badge variant="success">
              <BadgeCheck className="h-3 w-3" />
              Verified
            </Badge>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <StarRating rating={rating} size="sm" />
          <span className="text-xs text-gray-500">
            {rating.toFixed(1)} ({totalReviews}{" "}
            {totalReviews === 1 ? "review" : "reviews"})
          </span>
        </div>
        {services.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {services.slice(0, 4).map((s) => (
              <Badge key={s} variant="info">
                {s}
              </Badge>
            ))}
            {services.length > 4 && (
              <Badge variant="secondary">+{services.length - 4}</Badge>
            )}
          </div>
        )}
      </div>

      <div className="text-left sm:text-right">
        <p className="text-xs text-gray-500">Hourly rate</p>
        <p className="text-xl font-bold text-teal-700">
          ₹{hourlyRate}
          <span className="text-sm font-medium text-gray-500">/hr</span>
        </p>
      </div>
    </div>
  );
};

const StepIndicator = ({ current }) => (
  <ol className="flex items-center gap-3" aria-label="Booking steps">
    {STEPS.map((step, idx) => {
      const isActive = step.id === current;
      const isComplete = step.id < current;
      return (
        <li key={step.id} className="flex flex-1 items-center gap-2">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
              isComplete
                ? "bg-teal-600 text-white"
                : isActive
                ? "bg-teal-100 text-teal-700 ring-2 ring-teal-600"
                : "bg-gray-100 text-gray-500"
            }`}
            aria-current={isActive ? "step" : undefined}
          >
            {isComplete ? <Check className="h-4 w-4" /> : step.id}
          </div>
          <span
            className={`text-sm font-medium ${
              isActive || isComplete ? "text-gray-900" : "text-gray-500"
            }`}
          >
            {step.title}
          </span>
          {idx < STEPS.length - 1 && (
            <span
              aria-hidden="true"
              className={`ml-2 hidden h-px flex-1 sm:block ${
                isComplete ? "bg-teal-600" : "bg-gray-200"
              }`}
            />
          )}
        </li>
      );
    })}
  </ol>
);

const FormSkeleton = () => (
  <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
    <div className="h-8 w-1/3 animate-pulse rounded bg-gray-200" />
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const NotFoundState = ({ onBack }) => (
  <div className="mx-auto max-w-2xl px-4 py-24 text-center">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
      <AlertCircle className="h-8 w-8 text-gray-500" />
    </div>
    <h2 className="mt-4 text-2xl font-bold text-gray-900">Caretaker not found</h2>
    <p className="mt-2 text-gray-600">
      We couldn't load this caretaker's profile to start a booking.
    </p>
    <div className="mt-6 flex justify-center gap-3">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Back to search
      </Button>
    </div>
  </div>
);

const BookingFormPage = () => {
  const { caretakerUserId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successBooking, setSuccessBooking] = useState(null);

  const [formData, setFormData] = useState({
    elder: "",
    serviceType: "",
    scheduledDate: "",
    startTime: "",
    endTime: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    lat: "",
    lng: "",
    notes: "",
  });

  const [elders, setElders] = useState([]);
  const [loadingElders, setLoadingElders] = useState(true);
  const [eldersError, setEldersError] = useState(null);
  
  const [useElderAddress, setUseElderAddress] = useState(true);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Load elders list
  useEffect(() => {
    let cancelled = false;
    const fetchElders = async () => {
      setLoadingElders(true);
      setEldersError(null);
      try {
        const res = await api.get("/users/me/elders");
        if (cancelled) return;
        setElders(res.data);
      } catch (err) {
        if (cancelled) return;
        setEldersError("Could not load elders. Please try again.");
      } finally {
        if (!cancelled) setLoadingElders(false);
      }
    };
    fetchElders();
    return () => {
      cancelled = true;
    };
  }, []);

  // Guard: must be authenticated to book
  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  // Load caretaker profile
  useEffect(() => {
    if (!caretakerUserId) return;
    let cancelled = false;
    const fetchProfile = async () => {
      setLoadingProfile(true);
      setProfileError(null);
      setNotFound(false);
      try {
        const res = await api.get(`/caretakers/${caretakerUserId}/profile`);
        if (cancelled) return;
        setProfile(res.data);
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          setProfileError(
            err.response?.data?.message ||
              "Unable to load caretaker. Please try again later."
          );
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    };
    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [caretakerUserId]);

  useEffect(() => {
    if (!caretakerUserId || !formData.scheduledDate) {
      setBookedSlots([]);
      return;
    }
    let cancelled = false;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await api.get(`/bookings/caretaker/${caretakerUserId}/booked-slots?date=${formData.scheduledDate}`);
        if (cancelled) return;
        setBookedSlots(res.data);
      } catch (err) {
        console.error("Failed to load booked slots", err);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    };
    fetchSlots();
    return () => {
      cancelled = true;
    };
  }, [caretakerUserId, formData.scheduledDate]);

  const hasOverlap = useMemo(() => {
    if (!formData.startTime || !formData.endTime || bookedSlots.length === 0) return false;
    const startMin = parseTimeToMinutes(formData.startTime);
    const endMin = parseTimeToMinutes(formData.endTime);
    if (startMin === null || endMin === null) return false;
    return bookedSlots.some(slot => {
      const bStart = parseTimeToMinutes(slot.startTime);
      const bEnd = parseTimeToMinutes(slot.endTime);
      if (bStart === null || bEnd === null) return false;
      return startMin < bEnd && endMin > bStart;
    });
  }, [formData.startTime, formData.endTime, bookedSlots]);

  const profileServices = Array.isArray(profile?.services) ? profile.services : [];
  const availableServiceOptions = profileServices.length > 0 ? profileServices : SERVICE_OPTIONS;



  const hourlyRate = Number(profile?.hourlyRate) || 0;
  const durationHours = computeDurationHours(formData.startTime, formData.endTime);
  const totalAmount = computeTotal(hourlyRate, formData.startTime, formData.endTime);

  const selectedElder = useMemo(
    () => elders.find((e) => e._id === formData.elder) || null,
    [elders, formData.elder]
  );

  // Pre-fill address from the selected elder only when the user picks one.
  const handleElderChange = (value) => {
    const elder = elders.find((e) => e._id === value);
    setFormData((prev) => ({
      ...prev,
      elder: value,
      // Only auto-fill empty fields so we don't overwrite user edits.
      street: prev.street || elder?.address?.street || "",
      city: prev.city || elder?.address?.city || "",
      state: prev.state || elder?.address?.state || "",
      zipCode: prev.zipCode || elder?.address?.zipCode || "",
    }));
    if (submitError) setSubmitError(null);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (submitError) setSubmitError(null);
  };

  const validateDetails = () => {
    if (!formData.elder) return "Please choose an elder.";
    if (!formData.serviceType) return "Please choose a service type.";
    if (!formData.scheduledDate) return "Please pick a date.";
    if (!formData.startTime) return "Please choose a start time.";
    if (!formData.endTime) return "Please choose an end time.";
    if (computeDurationHours(formData.startTime, formData.endTime) <= 0) {
      return "End time must be after start time.";
    }
    if (hasOverlap) {
      return "The selected time overlaps with an existing booking.";
    }
    if (!useElderAddress) {
      if (!formData.street.trim() || !formData.city.trim()) {
        return "Please provide a street and city for the visit.";
      }
    }
    return null;
  };

  const handleNext = () => {
    if (step === 2) {
      const error = validateDetails();
      if (error) {
        setSubmitError(error);
        return;
      }
    }
    setSubmitError(null);
    setStep((s) => Math.min(STEPS.length, s + 1));
  };

  const handleBack = () => {
    setSubmitError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    const error = validateDetails();
    if (error) {
      setSubmitError(error);
      setStep(2);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        elder: formData.elder,
        caretaker: caretakerUserId,
        serviceType: formData.serviceType,
        scheduledDate: formData.scheduledDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        address: useElderAddress && selectedElder ? {
          street: selectedElder.address?.street || "",
          city: selectedElder.address?.city || "",
          state: selectedElder.address?.state || "",
          zipCode: selectedElder.address?.zipCode || "",
          coordinates: selectedElder.address?.coordinates || {}
        } : {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zipCode: formData.zipCode.trim(),
          coordinates: { lat: formData.lat, lng: formData.lng }
        },
        notes: formData.notes.trim(),
      };

      const res = await api.post("/bookings", payload);
      setSuccessBooking(res.data);
      setStep(3);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "We couldn't submit your booking. Please try again.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return null; // guard effect will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="mb-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-700">
            <CalendarCheck className="h-3.5 w-3.5" />
            Request a booking
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Book a caretaker
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Share your needs and the caretaker will respond with confirmation.
          </p>
        </div>

        <Card className="mb-6 border-gray-200">
          <CardContent className="p-4">
            <StepIndicator current={step} />
          </CardContent>
        </Card>

        {loadingProfile ? (
          <FormSkeleton />
        ) : notFound ? (
          <NotFoundState onBack={() => navigate("/search")} />
        ) : !profile ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
              <p className="mt-3 text-sm text-red-700">{profileError || "Unable to load profile."}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/search")}
              >
                Back to search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Caretaker</CardTitle>
              </CardHeader>
              <CardContent>
                <CaretakerSummary profile={profile} />
              </CardContent>
            </Card>

            {submitError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {step === 1 && (
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Review caretaker</CardTitle>
                  <CardDescription>
                    Confirm this is the right caretaker before continuing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.bio && (
                    <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                      {profile.bio}
                    </p>
                  )}
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleNext}>
                      Continue to booking details
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Booking details</CardTitle>
                  <CardDescription>
                    Tell us who, what, and when — we'll handle the rest.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="elder">Who is the care for?</Label>
                      {loadingElders ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 py-1">
                          <Loader2 className="h-4 w-4 animate-spin text-teal-600" /> Loading your elders...
                        </div>
                      ) : elders.length === 0 ? (
                        <div className="rounded-lg border border-amber-250 bg-amber-50 p-3 text-sm text-amber-800 flex flex-col gap-2 shadow-sm">
                          <span className="font-semibold">No elders linked to your account.</span>
                          <span className="text-xs text-gray-600">You need to register details for the senior receiving care before booking.</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="w-fit bg-white border-amber-300 hover:bg-amber-100 text-amber-900"
                            onClick={() => navigate("/dashboard")}
                          >
                            Go to Dashboard to Add Elder
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                            <Select
                              id="elder"
                              value={formData.elder}
                              onChange={(e) => handleElderChange(e.target.value)}
                              className="pl-10"
                            >
                              <option value="">Select an elder</option>
                              {elders.map((elder) => (
                                <option key={elder._id} value={elder._id}>
                                  {elder.firstName} {elder.lastName}
                                  {elder.relation ? ` (${elder.relation})` : ""}
                                </option>
                              ))}
                            </Select>
                          </div>
                          {eldersError && <p className="text-xs text-red-500 mt-1">{eldersError}</p>}
                        </>
                      )}
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="serviceType">Service type</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                        <Select
                          id="serviceType"
                          value={formData.serviceType}
                          onChange={(e) => handleChange("serviceType", e.target.value)}
                          className="pl-10"
                        >
                          <option value="">Choose a service</option>
                          {availableServiceOptions.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scheduledDate">Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <Input
                          id="scheduledDate"
                          type="date"
                          min={todayIsoDate()}
                          value={formData.scheduledDate}
                          onChange={(e) => handleChange("scheduledDate", e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start time</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                          <Input
                            id="startTime"
                            type="time"
                            value={formData.startTime}
                            onChange={(e) => handleChange("startTime", e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endTime">End time</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                          <Input
                            id="endTime"
                            type="time"
                            value={formData.endTime}
                            onChange={(e) => handleChange("endTime", e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    {loadingSlots ? (
                      <p className="text-sm text-gray-500 flex items-center gap-2 mt-3"><Loader2 className="h-4 w-4 animate-spin"/> Loading booked slots...</p>
                    ) : bookedSlots.length > 0 ? (
                      <div className="rounded bg-orange-50 p-3 border border-orange-100 mt-3">
                        <p className="text-sm font-medium text-orange-800 mb-2 flex items-center gap-1.5"><AlertCircle className="h-4 w-4"/> Already Booked Slots:</p>
                        <div className="flex flex-wrap gap-2">
                          {bookedSlots.map((slot, i) => (
                            <Badge key={i} variant="outline" className="bg-white text-orange-700 border-orange-200">
                              {formatTime12h(slot.startTime)} - {formatTime12h(slot.endTime)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : formData.scheduledDate && (
                      <p className="text-sm text-emerald-600 flex items-center gap-1.5 mt-3"><Check className="h-4 w-4"/> No bookings on this date yet.</p>
                    )}

                    {hasOverlap && (
                      <p className="text-sm text-red-600 flex items-center gap-1.5 mt-2 font-medium">
                        <AlertCircle className="h-4 w-4"/> The selected time overlaps with an existing booking.
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <MapPin className="h-4 w-4 text-teal-600" />
                        Service location
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            checked={useElderAddress}
                            onChange={() => setUseElderAddress(true)}
                            className="text-teal-600 focus:ring-teal-500 h-4 w-4"
                          />
                          Use Elder's Address
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            checked={!useElderAddress}
                            onChange={() => setUseElderAddress(false)}
                            className="text-teal-600 focus:ring-teal-500 h-4 w-4"
                          />
                          New Location
                        </label>
                      </div>
                    </div>

                    {useElderAddress ? (
                      selectedElder ? (
                        <div className="space-y-3 pt-2">
                          <div className="text-sm text-gray-700 bg-white p-3 rounded-md border border-gray-200">
                            {[selectedElder.address?.street, selectedElder.address?.city, selectedElder.address?.state, selectedElder.address?.zipCode]
                              .filter(Boolean)
                              .join(", ") || "No address provided for this elder."}
                          </div>
                          {selectedElder.address?.coordinates?.lat && selectedElder.address?.coordinates?.lng ? (
                            <MapPicker
                              lat={selectedElder.address.coordinates.lat}
                              lng={selectedElder.address.coordinates.lng}
                              readOnly={true}
                            />
                          ) : (
                            <div className="text-xs text-gray-500 italic">No map coordinates available for this elder.</div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic pt-2">Please select an elder first to use their address.</p>
                      )
                    ) : (
                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <Label htmlFor="street">Street</Label>
                          <Input
                            id="street"
                            type="text"
                            placeholder="123 Main St"
                            value={formData.street}
                            onChange={(e) => handleChange("street", e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="space-y-2 sm:col-span-1">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              type="text"
                              placeholder="San Francisco"
                              value={formData.city}
                              onChange={(e) => handleChange("city", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                              id="state"
                              type="text"
                              placeholder="CA"
                              value={formData.state}
                              onChange={(e) => handleChange("state", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="zipCode">ZIP</Label>
                            <Input
                              id="zipCode"
                              type="text"
                              placeholder="94110"
                              value={formData.zipCode}
                              onChange={(e) => handleChange("zipCode", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2 pt-2">
                          <Label className="text-sm">Pinpoint on Map</Label>
                          <MapPicker
                            lat={formData.lat}
                            lng={formData.lng}
                            onChange={(lat, lng) => setFormData(prev => ({...prev, lat, lng}))}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes for the caretaker (optional)</Label>
                    <div className="relative">
                      <StickyNote className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                      <textarea
                        id="notes"
                        rows={4}
                        maxLength={500}
                        placeholder="Anything the caretaker should know — allergies, preferences, mobility needs..."
                        value={formData.notes}
                        onChange={(e) => handleChange("notes", e.target.value)}
                        className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 pl-10 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-teal-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-right">
                      {formData.notes.length}/500
                    </p>
                  </div>

                  {durationHours > 0 && (
                    <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">
                          {durationHours.toFixed(2)} hrs × ₹{hourlyRate}/hr
                        </span>
                        <span className="text-base font-bold text-teal-700">
                          ₹{totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
                    <Button variant="outline" onClick={handleBack}>
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <Button onClick={handleNext} disabled={submitting}>
                      Review booking
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && successBooking && (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-7 w-7" />
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-gray-900">
                    Booking request sent!
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    We'll notify you once{" "}
                    {successBooking.caretaker?.firstName || "the caretaker"}{" "}
                    {successBooking.caretaker?.lastName || ""} responds.
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <Button onClick={() => navigate("/my-bookings")}>
                      View my bookings
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/search")}>
                      Find more caretakers
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && !successBooking && (
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Confirm your booking</CardTitle>
                  <CardDescription>
                    Double-check the details before submitting your request.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                      <dt className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                        <UserIcon className="h-3.5 w-3.5" /> Care for
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-gray-900">
                        {selectedElder
                          ? `${selectedElder.firstName} ${selectedElder.lastName}`
                          : "—"}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                      <dt className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" /> Service
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-gray-900">
                        {formData.serviceType || "—"}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                      <dt className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> Date
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-gray-900">
                        {formatDate(formData.scheduledDate)}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                      <dt className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> Time
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-gray-900">
                        {formData.startTime && formData.endTime
                          ? `${formatTime12h(formData.startTime)} – ${formatTime12h(
                              formData.endTime
                            )}`
                          : "—"}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-3 sm:col-span-2">
                      <dt className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> Address
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-gray-900">
                        {useElderAddress && selectedElder ? (
                          [selectedElder.address?.street, selectedElder.address?.city, selectedElder.address?.state, selectedElder.address?.zipCode]
                            .filter(Boolean)
                            .join(", ") || "—"
                        ) : (
                          [formData.street, formData.city, formData.state, formData.zipCode]
                            .filter(Boolean)
                            .join(", ") || "—"
                        )}
                      </dd>
                    </div>
                    {formData.notes && (
                      <div className="rounded-lg border border-gray-200 bg-white p-3 sm:col-span-2">
                        <dt className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                          <StickyNote className="h-3.5 w-3.5" /> Notes
                        </dt>
                        <dd className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                          {formData.notes}
                        </dd>
                      </div>
                    )}
                  </dl>

                  <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">
                        Estimated total ({durationHours.toFixed(2)} hrs × ₹{hourlyRate})
                      </span>
                      <span className="text-lg font-bold text-teal-700">
                        ₹{totalAmount.toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                      <Lock className="h-3 w-3" />
                      Payment is collected after the caretaker confirms.
                    </p>
                  </div>

                  <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={submitting}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to details
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        <>
                          <CalendarCheck className="h-4 w-4" />
                          Submit booking request
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingFormPage;
