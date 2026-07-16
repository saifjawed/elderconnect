import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CalendarCheck,
  CalendarX,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  MapPin,
  MessageSquare,
  Search,
  StickyNote,
  User as UserIcon,
  X,
  XCircle,
  ChevronDown,
  Shield,
  CreditCard,
} from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/contexts/useAuth";
import { useChat } from "@/contexts/ChatContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import StarRating from "@/components/StarRating";
import Navbar from "@/components/Navbar";

const STATUS_OPTIONS = [
  { value: "all", label: "All bookings" },
  { value: "Pending", label: "Pending" },
  { value: "Accepted", label: "Accepted" },
  { value: "In Progress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Declined", label: "Declined" },
];

const STATUS_STYLES = {
  Pending: {
    variant: "warning",
    label: "Pending",
    icon: Clock,
  },
  Accepted: {
    variant: "info",
    label: "Accepted",
    icon: CheckCircle2,
  },
  "In Progress": {
    variant: "info",
    label: "In Progress",
    icon: Clock,
  },
  Completed: {
    variant: "success",
    label: "Completed",
    icon: CheckCircle2,
  },
  Cancelled: {
    variant: "secondary",
    label: "Cancelled",
    icon: XCircle,
  },
  Declined: {
    variant: "destructive",
    label: "Declined",
    icon: XCircle,
  },
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

const formatDateLong = (dateInput) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (dateInput) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getBookingDateValue = (booking) => {
  if (!booking.scheduledDate) return 0;
  const d = new Date(booking.scheduledDate);
  if (Number.isNaN(d.getTime())) return 0;
  // Combine with startTime if present for accurate ordering
  if (booking.startTime && typeof booking.startTime === "string") {
    const match = /^(\d{1,2}):(\d{2})/.exec(booking.startTime);
    if (match) {
      d.setHours(Number(match[1]), Number(match[2]), 0, 0);
    }
  }
  return d.getTime();
};

const isUpcoming = (booking) => {
  if (!booking.scheduledDate) return false;
  if (["Cancelled", "Declined", "Completed"].includes(booking.status)) return false;
  const ts = getBookingDateValue(booking);
  return ts >= Date.now();
};

const BookingCard = ({ booking, onCancel, onReview, onMessage, cancellingId, userRole }) => {
  const caretaker = booking.caretaker || {};
  const caretakerName = `${caretaker.firstName || ""} ${caretaker.lastName || ""}`.trim() || "Caretaker";
  const initials = `${(caretaker.firstName || "")[0] || ""}${(caretaker.lastName || "")[0] || ""}`.toUpperCase() || "C";
  const customer = booking.customer || {};
  const customerName = `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
  const elder = booking.elder || null;
  const profile = booking.caretakerProfile || null;
  const rating = Number(profile?.rating) || 0;
  const hourlyRate = Number(profile?.hourlyRate) || 0;
  const statusKey = STATUS_STYLES[booking.status] ? booking.status : "Pending";
  const status = STATUS_STYLES[statusKey];
  const StatusIcon = status.icon;
  const upcoming = isUpcoming(booking);
  const canCancel = ["Pending", "Accepted"].includes(booking.status);

  return (
    <Card className="border-gray-200 transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar className="h-12 w-12 shrink-0 ring-2 ring-white shadow-sm">
              {caretaker.avatar ? (
                <img
                  src={caretaker.avatar}
                  alt={caretakerName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <AvatarFallback>{initials}</AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold text-gray-900">
                  {caretakerName}
                </h3>
                <Badge variant={status.variant}>
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </Badge>
                {upcoming && (
                  <Badge variant="default">
                    Upcoming
                  </Badge>
                )}
              </div>
              {profile?.services?.length > 0 && (
                <p className="mt-1 truncate text-xs text-gray-500">
                  {Array.isArray(profile.services)
                    ? profile.services.join(" · ")
                    : ""}
                </p>
              )}
              {profile && (
                <div className="mt-1 flex items-center gap-2">
                  <StarRating rating={rating} size="xs" />
                  <span className="text-xs text-gray-500">{rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold text-teal-700">
              ₹{Number(booking.totalAmount || 0).toFixed(2)}
            </p>
            {hourlyRate > 0 && (
              <p className="text-xs text-gray-500">₹{hourlyRate}/hr</p>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
            <span className="truncate">{formatDateLong(booking.scheduledDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
            <span className="truncate">
              {formatTime12h(booking.startTime)} – {formatTime12h(booking.endTime)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-700 sm:col-span-2">
            <MapPin className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
            <span className="truncate">
              {booking.address
                ? [booking.address.street, booking.address.city, booking.address.state]
                    .filter(Boolean)
                    .join(", ")
                : "Address unavailable"}
            </span>
          </div>
          {booking.serviceType && (
            <div className="flex items-center gap-2 text-gray-700 sm:col-span-2">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Service:
              </span>
              <span className="truncate">{booking.serviceType}</span>
            </div>
          )}
          {elder && (
            <div className="flex items-center gap-2 text-gray-700 sm:col-span-2">
              <UserIcon className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
              <span className="truncate">
                For {elder.firstName} {elder.lastName}
              </span>
            </div>
          )}
          {customerName && (
            <div className="flex items-center gap-2 text-gray-700 sm:col-span-2">
              <UserIcon className="h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
              <span className="truncate">Booked by {customerName}</span>
            </div>
          )}
        </div>

        {booking.status === 'Accepted' && booking.otp && (
          <div className="mt-3 rounded-md border border-teal-100 bg-teal-50 px-3 py-2 text-sm">
            <p className="flex items-start gap-1.5 font-semibold text-teal-900">
              <Shield className="h-4 w-4 mt-0.5 shrink-0" />
              Start Service OTP
            </p>
            <p className="mt-1 text-lg font-bold tracking-widest text-teal-700">
              {booking.otp}
            </p>
            <p className="mt-1 text-xs text-teal-800">
              Provide this OTP to the caretaker to begin the service.
            </p>
          </div>
        )}

        {booking.notes && (
          <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
            <p className="flex items-start gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
              <StickyNote className="h-3 w-3 mt-0.5" />
              Notes
            </p>
            <p className="mt-1 text-gray-700 whitespace-pre-wrap break-words">
              {booking.notes}
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-500">
            Created {formatDateTime(booking.createdAt)}
          </p>
          <div className="flex flex-wrap gap-2">
            {booking.status === "Accepted" && booking.paymentStatus === "Pending" && (
              <Button
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                onClick={() => window.location.href = `/payment/${booking._id}`}
              >
                <CreditCard className="h-4 w-4 mr-1.5" />
                Pay Now
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMessage(booking)}
            >
              <MessageSquare className="h-4 w-4" />
              Message
            </Button>
            {booking.status === "Completed" && userRole === "Customer" && (
              <Button variant="outline" size="sm" onClick={() => onReview(booking)}>
                <StarRating rating={0} size="xs" />
                Leave review
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(booking)}
                disabled={cancellingId === booking._id}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                {cancellingId === booking._id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarX className="h-4 w-4" />
                )}
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const BookingSkeleton = () => (
  <Card className="border-gray-200">
    <CardContent className="p-5">
      <div className="flex gap-3">
        <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-8 w-24 animate-pulse rounded bg-gray-100" />
        <div className="h-8 w-24 animate-pulse rounded bg-gray-100" />
      </div>
    </CardContent>
  </Card>
);

const EmptyState = ({ hasFilters, onClear }) => {
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gradient-to-br from-teal-50/50 to-emerald-50/30 px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 shadow-md">
        <CalendarCheck className="h-8 w-8 text-white" />
      </div>
      <h3 className="mt-4 text-xl font-semibold text-gray-900">
        {hasFilters ? "No bookings match your filters" : "No bookings yet"}
      </h3>
      <p className="mt-2 max-w-md mx-auto text-sm text-gray-600">
        {hasFilters
          ? "Try adjusting your status filter or search query to see more bookings."
          : "When you book a caretaker, your requests and upcoming visits will show up here."}
      </p>
      <div className="mt-6 flex justify-center gap-2">
        {hasFilters ? (
          <Button variant="outline" onClick={onClear}>
            <X className="h-4 w-4" />
            Clear filters
          </Button>
        ) : (
          <Button onClick={() => navigate("/search")}>Find a caretaker</Button>
        )}
      </div>
    </div>
  );
};

const SignInPrompt = () => {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600">
        <CalendarCheck className="h-8 w-8 text-white" />
      </div>
      <h2 className="mt-4 text-2xl font-bold text-gray-900">Sign in to view your bookings</h2>
      <p className="mt-2 text-gray-600">
        Sign in or create an account to manage your bookings and message caretakers.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button variant="outline" onClick={() => navigate("/login")}>
          Sign in
        </Button>
        <Button onClick={() => navigate("/register")}>
          Sign up
        </Button>
      </div>
    </div>
  );
};

const ReviewModal = ({ booking, onClose, onSubmit, submitting, error }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const caretakerName = booking.caretaker
    ? `${booking.caretaker.firstName} ${booking.caretaker.lastName}`.trim()
    : "Caretaker";

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ rating, comment });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Leave a Review</h2>
        <p className="text-sm text-gray-600 mb-6">
          How was your experience with {caretakerName}?
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <StarRating
              rating={rating}
              onRate={setRating}
              size="lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comment (Optional)</label>
            <textarea
              className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-teal-500 focus:ring-teal-500 min-h-[100px]"
              placeholder="Share details of your own experience"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || rating === 0}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Review
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openChatWith } = useChat();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [cancellingId, setCancellingId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [reviewingBooking, setReviewingBooking] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (statusFilter && statusFilter !== "all") {
          params.status = statusFilter;
        }
        const res = await api.get("/bookings/my-bookings", { params });
        if (cancelled) return;
        setBookings(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (cancelled) return;
        setError(
          err.response?.data?.message ||
            "Unable to load your bookings. Please try again."
        );
        setBookings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBookings();
    return () => {
      cancelled = true;
    };
  }, [user, statusFilter]);

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) => {
      const caretaker = b.caretaker || {};
      const customer = b.customer || {};
      const elder = b.elder || {};
      const haystack = [
        `${caretaker.firstName || ""} ${caretaker.lastName || ""}`,
        `${customer.firstName || ""} ${customer.lastName || ""}`,
        `${elder.firstName || ""} ${elder.lastName || ""}`,
        b.serviceType || "",
        b.notes || "",
        b.address?.city || "",
        b.address?.street || "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [bookings, search]);

  const groupedBookings = useMemo(() => {
    const sorted = [...filteredBookings].sort(
      (a, b) => getBookingDateValue(b) - getBookingDateValue(a)
    );
    const upcoming = [];
    const past = [];
    sorted.forEach((b) => {
      if (isUpcoming(b)) upcoming.push(b);
      else past.push(b);
    });
    return { upcoming, past };
  }, [filteredBookings]);

  const counts = useMemo(() => {
    const acc = { all: bookings.length };
    bookings.forEach((b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
    });
    return acc;
  }, [bookings]);

  const handleCancel = async (booking) => {
    if (!booking?._id) return;
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        "Are you sure you want to cancel this booking? This action cannot be undone."
      );
      if (!ok) return;
    }
    setCancellingId(booking._id);
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.delete(`/bookings/${booking._id}`);
      setBookings((prev) =>
        prev.map((b) => (b._id === booking._id ? { ...b, status: "Cancelled" } : b))
      );
      setActionSuccess("Booking cancelled.");
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Unable to cancel this booking right now."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const handleReview = (booking) => {
    if (!booking?._id) return;
    setReviewingBooking(booking);
    setReviewError(null);
  };

  const submitReview = async ({ rating, comment }) => {
    if (!reviewingBooking) return;
    setSubmittingReview(true);
    setReviewError(null);
    try {
      await api.post("/reviews", {
        bookingId: reviewingBooking._id,
        rating,
        comment,
      });
      setActionSuccess("Review submitted successfully!");
      setReviewingBooking(null);
    } catch (err) {
      setReviewError(
        err.response?.data?.message || "Failed to submit review. Please try again."
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleMessage = (booking) => {
    const targetUser = user?.role === 'Caretaker' ? booking.customer : booking.caretaker;
    if (targetUser) openChatWith(targetUser);
  };

  const handleClearFilters = () => {
    setStatusFilter("all");
    setSearch("");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Navbar />
        <SignInPrompt />
      </div>
    );
  }

  const hasActiveFilters = statusFilter !== "all" || search.trim() !== "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-700">
              <CalendarCheck className="h-3.5 w-3.5" />
              My bookings
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Your bookings
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage upcoming care visits and review past bookings.
            </p>
          </div>
          {user?.role !== 'Caretaker' && (
            <Button onClick={() => navigate("/search")}>Book another</Button>
          )}
        </div>

        {actionError && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
        {actionSuccess && (
          <div
            role="status"
            className="mb-4 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700"
          >
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        <Card className="mb-6 border-gray-200">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Search by caretaker, city, or service..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="hidden sm:block">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-9 pr-8 min-w-[170px]"
                    aria-label="Filter by status"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                        {opt.value === "all"
                          ? counts.all !== undefined
                            ? ` (${counts.all})`
                            : ""
                          : counts[opt.value] !== undefined
                          ? ` (${counts[opt.value]})`
                          : ""}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <Button
                variant="outline"
                className="sm:hidden justify-between"
                onClick={() => setShowFilters((s) => !s)}
                aria-expanded={showFilters}
              >
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Status
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
                />
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
            {showFilters && (
              <div className="mt-3 sm:hidden">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by status"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <BookingSkeleton key={i} />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            hasFilters={hasActiveFilters}
            onClear={handleClearFilters}
          />
        ) : (
          <div className="space-y-8">
            {groupedBookings.upcoming.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Upcoming
                  </h2>
                  <span className="text-xs text-gray-500">
                    {groupedBookings.upcoming.length} booking
                    {groupedBookings.upcoming.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {groupedBookings.upcoming.map((b) => (
                    <BookingCard
                      key={b._id}
                      booking={b}
                      onCancel={handleCancel}
                      onReview={handleReview}
                      onMessage={handleMessage}
                      cancellingId={cancellingId}
                      userRole={user?.role}
                    />
                  ))}
                </div>
              </section>
            )}

            {groupedBookings.past.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">History</h2>
                  <span className="text-xs text-gray-500">
                    {groupedBookings.past.length} booking
                    {groupedBookings.past.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {groupedBookings.past.map((b) => (
                    <BookingCard
                      key={b._id}
                      booking={b}
                      onCancel={handleCancel}
                      onReview={handleReview}
                      onMessage={handleMessage}
                      cancellingId={cancellingId}
                      userRole={user?.role}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {reviewingBooking && (
        <ReviewModal
          booking={reviewingBooking}
          onClose={() => setReviewingBooking(null)}
          onSubmit={submitReview}
          submitting={submittingReview}
          error={reviewError}
        />
      )}
    </div>
  );
};

export default MyBookingsPage;
