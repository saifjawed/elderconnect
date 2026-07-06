import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MapPicker from "@/components/MapPicker";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BarChart,
  Bell,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  Heart,
  Inbox,
  LayoutDashboard,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  X,
  XCircle,
  User as UserIcon,
  StickyNote,
  Shield,
} from "lucide-react";
import { io } from "socket.io-client";
import api from "@/services/api";
import { useAuth } from "@/contexts/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import StarRating from "@/components/StarRating";
import Navbar from "@/components/Navbar";

const STATUS_VARIANT = {
  Pending: "warning",
  Accepted: "info",
  "In Progress": "info",
  Completed: "success",
  Cancelled: "secondary",
  Declined: "destructive",
};

const STATUS_ICON = {
  Pending: Clock,
  Accepted: CheckCircle2,
  "In Progress": CalendarClock,
  Completed: CheckCircle2,
  Cancelled: XCircle,
  Declined: XCircle,
};

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_LABELS = {
  sunday: "Sun",
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
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

const getBookingDateValue = (booking) => {
  if (!booking.scheduledDate) return 0;
  const d = new Date(booking.scheduledDate);
  if (Number.isNaN(d.getTime())) return 0;
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
  return getBookingDateValue(booking) >= Date.now();
};

const getName = (person = {}, fallback = "") => {
  if (!person) return fallback;
  const first = person.firstName || "";
  const last = person.lastName || "";
  const combined = `${first} ${last}`.trim();
  return combined || person.name || fallback;
};

const getInitials = (person = {}, fallback = "U") => {
  const first = person.firstName?.[0] || person.name?.[0] || "";
  const last = person.lastName?.[0] || "";
  return (first + last).toUpperCase() || fallback;
};

const ToastStack = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] sm:w-96 pointer-events-none"
    >
      {toasts.map((t) => {
        const tone =
          t.type === "error"
            ? "border-red-200 bg-red-50 text-red-800"
            : t.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : t.type === "review"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-teal-200 bg-teal-50 text-teal-800";
        const Icon =
          t.type === "review"
            ? Star
            : t.type === "error"
            ? AlertCircle
            : t.type === "success"
            ? CheckCircle2
            : CalendarCheck;
        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-2 rounded-lg border p-3 shadow-md backdrop-blur ${tone}`}
          >
            <Icon className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs opacity-90">{t.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="rounded p-0.5 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, hint, tone = "default" }) => {
  const toneClasses = {
    default: "from-teal-500 to-emerald-600",
    info: "from-sky-500 to-indigo-600",
    warning: "from-amber-500 to-orange-600",
    success: "from-emerald-500 to-teal-600",
    muted: "from-slate-400 to-slate-600",
  };
  return (
    <Card className="border-gray-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            {hint && <p className="mt-1 text-xs text-gray-500 truncate">{hint}</p>}
          </div>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm text-white ${toneClasses[tone] || toneClasses.default}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const BookingRow = ({ booking, onAction, actionLabel, actionVariant = "outline" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const caretaker = booking.caretaker || {};
  const customer = booking.customer || {};
  const elder = booking.elder || null;
  const caretakerName = getName(caretaker, "Caretaker");
  const customerName = getName(customer, "");
  const initials = getInitials(caretaker, "C");
  const status = booking.status || "Pending";
  const variant = STATUS_VARIANT[status] || "secondary";
  const Icon = STATUS_ICON[status] || Clock;

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0 ring-2 ring-white shadow-sm">
            {caretaker.avatar ? (
              <img src={caretaker.avatar} alt={caretakerName} className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback>{initials}</AvatarFallback>
            )}
          </Avatar>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-gray-900">{caretakerName}</p>
            <Badge variant={variant}>
              <Icon className="h-3 w-3" />
              {status}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-teal-600" />
              {formatDateLong(booking.scheduledDate)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-teal-600" />
              {formatTime12h(booking.startTime)} – {formatTime12h(booking.endTime)}
            </span>
            {booking.serviceType && (
              <span className="truncate">{booking.serviceType}</span>
            )}
            {customerName && (
              <span className="truncate text-gray-500">for {customerName}</span>
            )}
          </div>
        </div>
      </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end w-full sm:w-auto pt-2 sm:pt-0 mt-2 sm:mt-0 border-t sm:border-0 border-gray-100">
          <span className="text-lg font-bold text-teal-700">
            ₹{Number(booking.totalAmount || 0).toFixed(2)}
          </span>
          <div className="flex items-center gap-2">
            {onAction && actionLabel && (
              <Button
                size="sm"
                variant={actionVariant}
                onClick={() => onAction(booking)}
              >
                {actionLabel}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2 bg-gray-50 hover:bg-gray-100"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            </Button>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-700 flex flex-col sm:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-4">
            {elder && (
              <div className="flex gap-3">
                {elder.avatar ? (
                  <Avatar className="h-10 w-10 shrink-0 ring-1 ring-gray-200">
                    <img src={elder.avatar} alt={elder.firstName} className="h-full w-full object-cover" />
                  </Avatar>
                ) : (
                  <UserIcon className="h-4 w-4 shrink-0 text-teal-600 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold text-gray-900">Elder Profile</p>
                  <p>{elder.firstName} {elder.lastName}</p>
                  {elder.relation && <p className="text-xs text-gray-500">{elder.relation}</p>}
                </div>
              </div>
            )}
            {booking.address && (
              <div className="flex gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-teal-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Location</p>
                  <p>
                    {[booking.address.street, booking.address.city, booking.address.state, booking.address.zipCode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
            )}
            {booking.notes && (
              <div className="flex gap-2">
                <StickyNote className="h-4 w-4 shrink-0 text-teal-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Customer Note</p>
                  <p className="whitespace-pre-wrap">{booking.notes}</p>
                </div>
              </div>
            )}
          </div>
          
          {booking.address?.coordinates?.lat && booking.address?.coordinates?.lng && (
            <div className="w-full sm:w-[300px] md:w-[350px] shrink-0 overflow-hidden rounded-md border border-gray-200">
              <MapPicker 
                readOnly 
                lat={booking.address.coordinates.lat} 
                lng={booking.address.coordinates.lng} 
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CustomerView = ({ bookings, loading }) => {
  const [showRecent, setShowRecent] = useState(true);
  const navigate = useNavigate();

  // Elder management states
  const [elders, setElders] = useState([]);
  const [eldersLoading, setEldersLoading] = useState(true);
  const [eldersError, setEldersError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingElder, setEditingElder] = useState(null);
  const [elderForm, setElderForm] = useState({
    firstName: "",
    lastName: "",
    relation: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    avatarFile: null,
    avatarPreview: ""
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchElders = async () => {
    setEldersLoading(true);
    try {
      const res = await api.get("/users/me/elders");
      setElders(res.data);
    } catch (err) {
      setEldersError("Could not load elders.");
    } finally {
      setEldersLoading(false);
    }
  };

  useEffect(() => {
    fetchElders();
  }, []);

  const handleOpenAdd = () => {
    setEditingElder(null);
    setElderForm({
      firstName: "",
      lastName: "",
      relation: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      lat: null,
      lng: null,
      avatarFile: null,
      avatarPreview: ""
    });
    setModalError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (elder) => {
    setEditingElder(elder);
    setElderForm({
      firstName: elder.firstName || "",
      lastName: elder.lastName || "",
      relation: elder.relation || "",
      phone: elder.phone || "",
      street: elder.address?.street || "",
      city: elder.address?.city || "",
      state: elder.address?.state || "",
      zipCode: elder.address?.zipCode || "",
      lat: elder.address?.coordinates?.lat || null,
      lng: elder.address?.coordinates?.lng || null,
      avatarFile: null,
      avatarPreview: elder.avatar || ""
    });
    setModalError(null);
    setModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!elderForm.firstName.trim() || !elderForm.lastName.trim()) {
      setModalError("First name and last name are required.");
      return;
    }
    if (!elderForm.street.trim() || !elderForm.city.trim() || !elderForm.state.trim() || !elderForm.zipCode.trim()) {
      setModalError("Please fill out the complete address for the elder.");
      return;
    }
    if (elderForm.lat === null || elderForm.lng === null) {
      setModalError("Please choose the elder's location on the map.");
      return;
    }
    setModalSubmitting(true);
    setModalError(null);
    try {
      const payload = {
        firstName: elderForm.firstName.trim(),
        lastName: elderForm.lastName.trim(),
        relation: elderForm.relation.trim(),
        phone: elderForm.phone.trim(),
        address: {
          street: elderForm.street.trim(),
          city: elderForm.city.trim(),
          state: elderForm.state.trim(),
          zipCode: elderForm.zipCode.trim(),
          coordinates: {
            lat: elderForm.lat ? Number(elderForm.lat) : null,
            lng: elderForm.lng ? Number(elderForm.lng) : null
          }
        }
      };

      let savedElder;
      if (editingElder) {
        const res = await api.put(`/users/me/elders/${editingElder._id}`, payload);
        savedElder = res.data;
      } else {
        const res = await api.post("/users/me/elders", payload);
        savedElder = res.data;
      }

      if (elderForm.avatarFile) {
        const formData = new FormData();
        formData.append("avatar", elderForm.avatarFile);
        await api.post(`/users/me/elders/${savedElder._id}/avatar`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else if (!elderForm.avatarPreview && editingElder?.avatar) {
        // Handle avatar deletion if they cleared it
        await api.delete(`/users/me/elders/${savedElder._id}/avatar`);
      }

      setModalOpen(false);
      fetchElders();
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to save elder details.");
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDeleteElder = async (elderId) => {
    if (!window.confirm("Are you sure you want to remove this elder?")) return;
    try {
      await api.delete(`/users/me/elders/${elderId}`);
      fetchElders();
    } catch (err) {
      alert("Failed to remove elder.");
    }
  };

  const { next, averageRating, count } = useMemo(() => {
    const sorted = [...bookings].sort(
      (a, b) => getBookingDateValue(a) - getBookingDateValue(b)
    );
    const upcomingList = sorted.filter(isUpcoming);
    const pastList = sorted
      .filter((b) => !isUpcoming(b))
      .sort((a, b) => getBookingDateValue(b) - getBookingDateValue(a));
    const ratingsWithCaretaker = sorted
      .map((b) => Number(b.caretakerProfile?.rating) || 0)
      .filter((r) => r > 0);
    const avg =
      ratingsWithCaretaker.length > 0
        ? ratingsWithCaretaker.reduce((acc, r) => acc + r, 0) / ratingsWithCaretaker.length
        : 0;
    return {
      upcoming: upcomingList,
      past: pastList,
      next: upcomingList[0] || null,
      averageRating: avg,
      count: { upcoming: upcomingList.length, past: pastList.length },
    };
  }, [bookings]);

  const nextCaretakerName = next ? getName(next.caretaker, "Caretaker") : "";
  const nextInitials = next ? getInitials(next.caretaker, "C") : "";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={CalendarClock}
          label="Upcoming bookings"
          value={count.upcoming}
          tone="info"
          hint={next ? formatDateLong(next.scheduledDate) : "No upcoming visits"}
        />
        <StatCard
          icon={CalendarCheck}
          label="Past bookings"
          value={count.past}
          tone="default"
          hint={count.past === 0 ? "Complete a booking to start history" : undefined}
        />
        <StatCard
          icon={Star}
          label="Avg caretaker rating"
          value={averageRating > 0 ? averageRating.toFixed(1) : "—"}
          tone="warning"
          hint={averageRating > 0 ? "Across your caretakers" : "No ratings yet"}
        />
      </div>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-teal-600" />
            Next upcoming booking
          </CardTitle>
          <CardDescription>
            Your next scheduled care visit at a glance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading bookings...
            </div>
          ) : next ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                  {next.caretaker?.avatar ? (
                    <img
                      src={next.caretaker.avatar}
                      alt={nextCaretakerName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <AvatarFallback>{nextInitials}</AvatarFallback>
                  )}
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-gray-900">
                    {nextCaretakerName}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-700">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-teal-600" />
                      {formatDateLong(next.scheduledDate)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-4 w-4 text-teal-600" />
                      {formatTime12h(next.startTime)} – {formatTime12h(next.endTime)}
                    </span>
                    {next.serviceType && (
                      <span className="truncate">{next.serviceType}</span>
                    )}
                  </div>
                  {next.caretakerProfile?.rating ? (
                    <div className="mt-1 flex items-center gap-1.5">
                      <StarRating
                        rating={Number(next.caretakerProfile.rating) || 0}
                        size="xs"
                      />
                      <span className="text-xs text-gray-500">
                        {(Number(next.caretakerProfile.rating) || 0).toFixed(1)}
                      </span>
                    </div>
                  ) : null}
                  <Badge variant={STATUS_VARIANT[next.status] || "secondary"} className="mt-2">
                    {(() => {
                      const Icon = STATUS_ICON[next.status] || Clock;
                      return (
                        <>
                          <Icon className="h-3 w-3" />
                          {next.status}
                        </>
                      );
                    })()}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/my-bookings`)}
                >
                  View details
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    navigate(
                      `/messages?with=${next.caretaker?._id || ""}`
                    )
                  }
                >
                  <MessageSquare className="h-4 w-4" />
                  Message
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
              <p className="text-sm text-gray-600">No upcoming bookings yet.</p>
              <Button className="mt-3" size="sm" onClick={() => navigate("/search")}>
                <Search className="h-4 w-4" />
                Find a caretaker
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <button
            type="button"
            className="flex w-full items-center justify-between text-left"
            onClick={() => setShowRecent((v) => !v)}
            aria-expanded={showRecent}
          >
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Inbox className="h-4 w-4 text-teal-600" />
                Recent bookings
              </CardTitle>
              <CardDescription>Your last {Math.min(5, bookings.length)} bookings.</CardDescription>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform ${
                showRecent ? "rotate-180" : ""
              }`}
            />
          </button>
        </CardHeader>
        {showRecent && (
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : bookings.length === 0 ? (
              <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
                No bookings to show.
              </p>
            ) : (
              bookings
                .slice()
                .sort((a, b) => getBookingDateValue(b) - getBookingDateValue(a))
                .slice(0, 5)
                .map((b) => (
                  <BookingRow
                    key={b._id}
                    booking={b}
                    onAction={() => navigate("/my-bookings")}
                    actionLabel="View"
                  />
                ))
            )}
          </CardContent>
        )}
      </Card>

      <Card className="border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-600" />
              My Elders
            </CardTitle>
            <CardDescription>
              Manage profile details for seniors in your care.
            </CardDescription>
          </div>
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 font-semibold" onClick={handleOpenAdd}>
            Add Elder
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {eldersLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading elders...
            </div>
          ) : eldersError ? (
            <p className="text-sm text-red-600">{eldersError}</p>
          ) : elders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
              <p className="text-sm text-gray-600">No elders added yet.</p>
              <Button className="mt-3" variant="outline" size="sm" onClick={handleOpenAdd}>
                Add your first elder
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {elders.map((elder) => (
                <div
                  key={elder._id}
                  className="rounded-lg border border-gray-200 bg-white p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {elder.firstName} {elder.lastName}
                    </h4>
                    {elder.relation && (
                      <Badge variant="secondary" className="mt-1">
                        {elder.relation}
                      </Badge>
                    )}
                    {elder.address?.city ? (
                      <p className="mt-2 text-xs text-gray-600 flex items-start gap-1">
                        <MapPin className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <span>
                          {elder.address.street || ""}, {elder.address.city}, {elder.address.state || ""} {elder.address.zipCode || ""}
                        </span>
                      </p>
                    ) : null}
                    {elder.phone ? (
                      <p className="mt-1 text-xs text-gray-600 flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <span>{elder.phone}</span>
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-4 flex gap-2 justify-end border-t border-gray-100 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(elder)}
                      className="h-8 text-xs px-2.5"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteElder(elder._id)}
                      className="h-8 text-xs px-2.5"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-teal-600" />
            Quick actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button variant="outline" className="justify-start" onClick={() => navigate("/search")}>
              <Search className="h-4 w-4" />
              Find a Caretaker
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate("/my-bookings")}
            >
              <CalendarCheck className="h-4 w-4" />
              My Bookings
            </Button>
          </div>
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            
            <h3 className="text-lg font-bold text-gray-900">
              {editingElder ? "Edit Elder Profile" : "Add Elder Profile"}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Provide details for the senior receiving care.
            </p>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              {modalError && (
                <div className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  {modalError}
                </div>
              )}

              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-20 w-20 ring-2 ring-gray-100 shadow-sm">
                  {elderForm.avatarPreview ? (
                    <img src={elderForm.avatarPreview} alt="Elder Preview" className="h-full w-full object-cover" />
                  ) : (
                    <AvatarFallback className="bg-teal-50 text-teal-700">
                      <UserIcon className="h-10 w-10" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="elderAvatar"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setElderForm(prev => ({
                          ...prev,
                          avatarFile: file,
                          avatarPreview: URL.createObjectURL(file)
                        }));
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => document.getElementById('elderAvatar').click()}>
                    Upload Photo
                  </Button>
                  {elderForm.avatarPreview && (
                    <Button type="button" variant="ghost" size="sm" className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setElderForm(prev => ({ ...prev, avatarFile: null, avatarPreview: "" }))}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="elderFirstName" className="text-xs">First Name</Label>
                  <Input
                    id="elderFirstName"
                    value={elderForm.firstName}
                    onChange={(e) => setElderForm(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="elderLastName" className="text-xs">Last Name</Label>
                  <Input
                    id="elderLastName"
                    value={elderForm.lastName}
                    onChange={(e) => setElderForm(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="elderRelation" className="text-xs">Relation</Label>
                  <select
                    id="elderRelation"
                    value={elderForm.relation}
                    onChange={(e) => setElderForm(prev => ({ ...prev, relation: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-teal-500"
                  >
                    <option value="">Select Relation</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Grandmother">Grandmother</option>
                    <option value="Grandfather">Grandfather</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="elderPhone" className="text-xs">Phone (optional)</Label>
                  <Input
                    id="elderPhone"
                    value={elderForm.phone}
                    onChange={(e) => setElderForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-gray-150 bg-gray-50 p-3">
                <p className="text-xs font-semibold text-gray-800">Elder's Home Address</p>
                <div className="space-y-1">
                  <Label htmlFor="elderStreet" className="text-[10px]">Street</Label>
                  <Input
                    id="elderStreet"
                    value={elderForm.street}
                    onChange={(e) => setElderForm(prev => ({ ...prev, street: e.target.value }))}
                    placeholder="123 Main St"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="elderCity" className="text-[10px]">City</Label>
                    <Input
                      id="elderCity"
                      value={elderForm.city}
                      onChange={(e) => setElderForm(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="San Francisco"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="elderState" className="text-[10px]">State</Label>
                    <Input
                      id="elderState"
                      value={elderForm.state}
                      onChange={(e) => setElderForm(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="CA"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="elderZipCode" className="text-[10px]">ZIP</Label>
                    <Input
                      id="elderZipCode"
                      value={elderForm.zipCode}
                      onChange={(e) => setElderForm(prev => ({ ...prev, zipCode: e.target.value }))}
                      placeholder="94110"
                    />
                  </div>
                </div>
                <div className="space-y-1 pt-1">
                  <Label className="text-[10px]">Choose Elder Location on Map</Label>
                  <MapPicker
                    lat={elderForm.lat}
                    lng={elderForm.lng}
                    onChange={(lat, lng) => setElderForm(prev => ({ ...prev, lat, lng }))}
                  />
                  <p className="text-[9px] text-gray-500">
                    Click on the map or use the locate button to pinpoint the elder's coordinates.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  disabled={modalSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-700" disabled={modalSubmitting}>
                  {modalSubmitting ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const CaretakerView = ({ bookings, profile, loading, onStatusChange, refreshing }) => {
  const [reviewingId, setReviewingId] = useState(null);
  const [kycFile, setKycFile] = useState(null);
  const [kycDocType, setKycDocType] = useState("Aadhar");
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycError, setKycError] = useState(null);
  const navigate = useNavigate();

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!kycFile) {
      setKycError("Please select a document image to upload.");
      return;
    }
    setKycSubmitting(true);
    setKycError(null);
    try {
      const formData = new FormData();
      formData.append("avatar", kycFile);
      formData.append("docType", kycDocType);
      await api.post("/caretakers/me/kyc", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      window.location.reload();
    } catch (err) {
      setKycError(err.response?.data?.message || "Upload failed");
    } finally {
      setKycSubmitting(false);
    }
  };

  const grouped = useMemo(() => {
    const pending = [];
    const active = [];
    const completed = [];
    bookings.forEach((b) => {
      if (b.status === "Pending") pending.push(b);
      else if (["Accepted", "In Progress"].includes(b.status)) active.push(b);
      else if (b.status === "Completed") completed.push(b);
    });
    const completedSorted = completed
      .slice()
      .sort((a, b) => getBookingDateValue(b) - getBookingDateValue(a));
    const pendingSorted = pending
      .slice()
      .sort((a, b) => getBookingDateValue(a) - getBookingDateValue(b));
    const activeSorted = active
      .slice()
      .sort((a, b) => getBookingDateValue(a) - getBookingDateValue(b));
    return { pending: pendingSorted, active: activeSorted, completed: completedSorted };
  }, [bookings]);

  const averageRating = Number(profile?.rating) || 0;

  const profileChecks = useMemo(() => {
    const items = [
      {
        key: "profile",
        label: "Profile created",
        done: Boolean(profile && (profile.bio || profile.hourlyRate || profile.services?.length)),
      },
      {
        key: "bio",
        label: "Bio added",
        done: Boolean(profile?.bio && profile.bio.trim().length >= 10),
      },
      {
        key: "services",
        label: "Services defined",
        done: Boolean(Array.isArray(profile?.services) && profile.services.length > 0),
      },
      {
        key: "availability",
        label: "Availability set",
        done: Boolean(
          profile?.availability &&
            DAY_KEYS.some((d) => profile.availability[d]?.available)
        ),
      },
    ];
    return items;
  }, [profile]);

  const completeness = useMemo(() => {
    const done = profileChecks.filter((c) => c.done).length;
    return Math.round((done / profileChecks.length) * 100);
  }, [profileChecks]);

  const weeklySchedule = useMemo(() => {
    return DAY_KEYS.map((key) => {
      const slot = profile?.availability?.[key];
      return {
        key,
        label: DAY_LABELS[key],
        available: Boolean(slot?.available),
        range:
          slot?.available && slot.start && slot.end
            ? `${formatTime12h(slot.start)} – ${formatTime12h(slot.end)}`
            : "Off",
      };
    });
  }, [profile]);

  const handleAccept = (b) => onStatusChange?.(b, "Accepted");
  const handleDecline = (b) => onStatusChange?.(b, "Declined");
  const handleStart = (b) => onStatusChange?.(b, "In Progress");
  const handleComplete = (b) => onStatusChange?.(b, "Completed");

  return (
    <div className="space-y-6">
      {profile?.verificationStatus === 'Pending' || profile?.verificationStatus === 'Rejected' ? (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-orange-800">
              <Shield className="h-4 w-4" />
              Verification Required
            </CardTitle>
            <CardDescription className="text-orange-700">
              {profile?.verificationStatus === 'Rejected' 
                ? "Your previous verification was rejected. Please upload valid KYC documents (Aadhar or PAN) to be listed in search results and accept bookings."
                : "Please upload your KYC documents (Aadhar or PAN) to verify your identity. You will not appear in search results until verified."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleKycSubmit} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="space-y-1 w-full sm:w-auto">
                <Label htmlFor="kycDocType" className="text-xs text-orange-900">Document Type</Label>
                <select 
                  id="kycDocType" 
                  value={kycDocType} 
                  onChange={(e) => setKycDocType(e.target.value)}
                  className="flex h-9 w-full sm:w-[150px] rounded-md border border-orange-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-teal-500"
                >
                  <option value="Aadhar">Aadhar Card</option>
                  <option value="PAN">PAN Card</option>
                </select>
              </div>
              <div className="space-y-1 w-full sm:w-auto flex-1">
                <Label htmlFor="kycFile" className="text-xs text-orange-900">Upload Image</Label>
                <Input
                  id="kycFile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setKycFile(e.target.files[0])}
                  className="bg-white border-orange-200 cursor-pointer h-9"
                />
              </div>
              <Button type="submit" size="sm" className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 h-9" disabled={kycSubmitting}>
                {kycSubmitting ? "Uploading..." : "Submit for Verification"}
              </Button>
            </form>
            {kycError && <p className="mt-2 text-sm text-red-600">{kycError}</p>}
          </CardContent>
        </Card>
      ) : profile?.verificationStatus === 'Submitted' ? (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 flex items-center gap-3 text-blue-800">
            <Shield className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Verification Under Review</p>
              <p className="text-xs mt-0.5 opacity-90">Your KYC documents have been submitted and are pending admin approval. You will be notified once verified.</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Inbox}
          label="Pending requests"
          value={grouped.pending.length}
          tone="warning"
          hint={grouped.pending.length > 0 ? "Action required" : "All caught up"}
        />
        <StatCard
          icon={CalendarClock}
          label="Active bookings"
          value={grouped.active.length}
          tone="info"
        />
        <StatCard
          icon={CalendarCheck}
          label="Completed"
          value={grouped.completed.length}
          tone="success"
        />
        <StatCard
          icon={Star}
          label="Avg rating"
          value={averageRating > 0 ? averageRating.toFixed(1) : "—"}
          tone="warning"
          hint={averageRating > 0 ? `${profile?.totalReviews || 0} reviews` : "No reviews yet"}
        />
      </div>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-teal-600" />
            Pending requests
            {grouped.pending.length > 0 && (
              <Badge variant="warning">{grouped.pending.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Review incoming bookings and accept or decline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading || refreshing ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading requests...
            </div>
          ) : grouped.pending.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
              No new requests right now.
            </p>
          ) : (
            grouped.pending.map((b) => (
              <BookingRow
                key={b._id}
                booking={b}
                onAction={handleAccept}
                actionLabel="Accept"
                actionVariant="default"
              />
            ))
          )}
          {grouped.pending.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => grouped.pending[0] && handleDecline(grouped.pending[0])}
              >
                Decline first
              </Button>
              <Button
                size="sm"
                onClick={() => grouped.pending[0] && handleAccept(grouped.pending[0])}
              >
                Accept first
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-teal-600" />
            Active bookings
          </CardTitle>
          <CardDescription>Accepted or in-progress visits.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading || refreshing ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : grouped.active.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
              No active bookings yet.
            </p>
          ) : (
            grouped.active.map((b) => (
              <BookingRow
                key={b._id}
                booking={b}
                onAction={
                  b.status === "Accepted" ? handleStart : handleComplete
                }
                actionLabel={b.status === "Accepted" ? "Start" : "Complete"}
                actionVariant="default"
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-teal-600" />
            Recent completed bookings
          </CardTitle>
          <CardDescription>Encourage reviews to build trust.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading || refreshing ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : grouped.completed.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
              Completed visits will appear here.
            </p>
          ) : (
            grouped.completed.slice(0, 5).map((b) => (
              <BookingRow
                key={b._id}
                booking={b}
                onAction={() => {
                  setReviewingId(b._id);
                  navigate(`/bookings/${b._id}/review`);
                }}
                actionLabel="Review link"
              />
            ))
          )}
          {reviewingId && (
            <p className="text-xs text-gray-500">
              Tip: Ask customers to leave a review after each visit.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-teal-600" />
            Profile completeness
          </CardTitle>
          <CardDescription>
            Help families find you by completing your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">
              {completeness}% complete
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/caretaker/profile/edit")}
            >
              Edit profile
            </Button>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-600 transition-all"
              style={{ width: `${completeness}%` }}
              role="progressbar"
              aria-valuenow={completeness}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            {profileChecks.map((c) => (
              <li key={c.key} className="flex items-center gap-2">
                {c.done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-300" />
                )}
                <span className={c.done ? "text-gray-700" : "text-gray-500"}>
                  {c.label}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart className="h-4 w-4 text-teal-600" />
            Weekly schedule preview
          </CardTitle>
          <CardDescription>
            Your configured availability for the week.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {weeklySchedule.map((d) => (
              <div
                key={d.key}
                className={`rounded-md border p-3 text-center ${
                  d.available
                    ? "border-teal-200 bg-teal-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {d.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {d.available ? d.range : "Off"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ElderView = ({ bookings, loading }) => {
  const navigate = useNavigate();

  const { past, assigned, next } = useMemo(() => {
    const sorted = [...bookings].sort(
      (a, b) => getBookingDateValue(a) - getBookingDateValue(b)
    );
    const upcomingList = sorted.filter(isUpcoming);
    const pastList = sorted
      .filter((b) => !isUpcoming(b))
      .sort((a, b) => getBookingDateValue(b) - getBookingDateValue(a));
    return {
      past: pastList,
      assigned: upcomingList[0]?.caretaker || pastList[0]?.caretaker || null,
      next: upcomingList[0] || null,
    };
  }, [bookings]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          icon={UserCheck}
          label="Assigned caretaker"
          value={getName(assigned, "—")}
          tone="info"
          hint={assigned?.phone || assigned?.email || undefined}
        />
        <StatCard
          icon={CalendarCheck}
          label="Past visits"
          value={past.length}
          tone="success"
        />
      </div>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-teal-600" />
            Next visit
          </CardTitle>
          <CardDescription>Your next scheduled care visit.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading visits...
            </div>
          ) : next ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                  {next.caretaker?.avatar ? (
                    <img
                      src={next.caretaker.avatar}
                      alt={getName(next.caretaker, "")}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <AvatarFallback>{getInitials(next.caretaker, "C")}</AvatarFallback>
                  )}
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-gray-900">
                    {getName(next.caretaker, "Caretaker")}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-700">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-teal-600" />
                      {formatDateLong(next.scheduledDate)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-4 w-4 text-teal-600" />
                      {formatTime12h(next.startTime)} – {formatTime12h(next.endTime)}
                    </span>
                    {next.serviceType && (
                      <span className="truncate">{next.serviceType}</span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  navigate(`/messages?with=${next.caretaker?._id || ""}`)
                }
              >
                <MessageSquare className="h-4 w-4" />
                Message
              </Button>
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
              No upcoming visits scheduled.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-teal-600" />
            Recent visit history
          </CardTitle>
          <CardDescription>Your most recent care visits.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : past.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
              Your visit history will appear here after your first completed visit.
            </p>
          ) : (
            past.slice(0, 5).map((b) => (
              <BookingRow key={b._id} booking={b} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const pushToast = (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchData = async ({ silent = false } = {}) => {
    if (!user) return;
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const requests = [api.get("/bookings/my-bookings")];
      if (user.role === "Caretaker") {
        requests.push(api.get(`/caretakers/${user._id || user.id}/profile`).catch(() => null));
      }
      const [bookingsRes, profileRes] = await Promise.all(requests);
      setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      if (profileRes && profileRes.data) {
        setProfile(profileRes.data);
      } else if (user.role !== "Caretaker") {
        setProfile(null);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to load your dashboard. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user) return undefined;
    // Defer to next microtask to satisfy react-hooks/set-state-in-effect rule.
    const handle = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_API_URL?.replace(/\/api$/, "") ||
      "http://localhost:5000";
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    socketRef.current = socket;

    const handleConnect = () => {
      socket.emit("join", user._id || user.id);
    };

    const handleNewBooking = (booking) => {
      pushToast({
        title: "New booking request",
        description: booking?.serviceType
          ? `${booking.serviceType} scheduled`
          : "You have a new booking request.",
        type: "info",
      });
      fetchData({ silent: true });
    };

    const handleBookingUpdate = (booking) => {
      pushToast({
        title: "Booking updated",
        description: booking?.status
          ? `Status changed to ${booking.status}`
          : "Your booking was updated.",
        type: booking?.status === "Cancelled" || booking?.status === "Declined"
          ? "error"
          : "info",
      });
      fetchData({ silent: true });
    };

    const handleNewReview = (review) => {
      pushToast({
        title: "New review received",
        description: review?.rating
          ? `${Number(review.rating).toFixed(1)} / 5 stars`
          : "You received a new review.",
        type: "review",
      });
      fetchData({ silent: true });
    };

    socket.on("connect", handleConnect);
    socket.on("newBooking", handleNewBooking);
    socket.on("bookingUpdate", handleBookingUpdate);
    socket.on("newReview", handleNewReview);

    if (socket.connected) handleConnect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("newBooking", handleNewBooking);
      socket.off("bookingUpdate", handleBookingUpdate);
      socket.off("newReview", handleNewReview);
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleStatusChange = async (booking, newStatus) => {
    if (!booking?._id) return;
    try {
      await api.put(`/bookings/${booking._id}/status`, { status: newStatus });
      pushToast({
        title: "Status updated",
        description: `Booking marked as ${newStatus}.`,
        type: newStatus === "Declined" ? "error" : "success",
      });
      fetchData({ silent: true });
    } catch (err) {
      pushToast({
        title: "Update failed",
        description:
          err?.response?.data?.message || "Could not update booking status.",
        type: "error",
      });
    }
  };

  if (authLoading || (!user && loading === false && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const role = user.role || "Customer";
  const fullName = getName(user, "there");
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4 -ml-2"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
          Back
        </Button>

        <Card className="mb-6 border-teal-100 bg-gradient-to-br from-teal-50 via-white to-emerald-50">
          <CardContent className="p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md">
                  <LayoutDashboard className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
                    {role} dashboard
                  </p>
                  <h1 className="mt-1 text-2xl font-bold text-gray-900">
                    Welcome back, {fullName.split(" ")[0] || "there"}!
                  </h1>
                  <p className="mt-0.5 text-sm text-gray-600">{today}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {role === "Caretaker" && (
                  <Button variant="outline" onClick={() => navigate("/caretaker/profile/edit")}>
                    <UserCheck className="h-4 w-4" />
                    Edit profile
                  </Button>
                )}
                {role === "Customer" && (
                  <>
                    <Button variant="outline" onClick={() => navigate("/profile/edit")}>
                      <UserCheck className="h-4 w-4" />
                      Edit profile
                    </Button>
                    <Button onClick={() => navigate("/search")}>
                      <Search className="h-4 w-4" />
                      Find a caretaker
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchData()}
                  disabled={refreshing || loading}
                >
                  {refreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarClock className="h-4 w-4" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>
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

        {role === "Admin" ? (
          <Card className="border-gray-200">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-gray-700">
                Administrator tools are available in the admin dashboard.
              </p>
              <Button className="mt-3" onClick={() => navigate("/admin/dashboard")}>
                Open admin dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : role === "Caretaker" ? (
          <CaretakerView
            bookings={bookings}
            profile={profile}
            loading={loading}
            refreshing={refreshing}
            onStatusChange={handleStatusChange}
          />
        ) : role === "Elder" ? (
          <ElderView bookings={bookings} loading={loading} />
        ) : (
          <CustomerView bookings={bookings} loading={loading} />
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
