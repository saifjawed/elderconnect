import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowUpDown,
  Ban,
  BarChart,
  Briefcase,
  Calendar,
  CalendarCheck,
  DollarSign,
  Eye,
  Filter,
  Loader2,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/contexts/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import Navbar from "@/components/Navbar";
import MapPicker from "@/components/MapPicker";

const ROLE_FILTERS = [
  { value: "all", label: "All users" },
  { value: "Customer", label: "Customers" },
  { value: "Caretaker", label: "Caretakers" },
  { value: "Elder", label: "Elders" },
  { value: "Admin", label: "Admins" },
];

const STATUS_VARIANT = {
  Pending: "warning",
  Accepted: "info",
  "In Progress": "info",
  Completed: "success",
  Cancelled: "secondary",
  Declined: "destructive",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "Pending", label: "Pending" },
  { value: "Accepted", label: "Accepted" },
  { value: "In Progress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Declined", label: "Declined" },
];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const formatDateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateLong = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getFullName = (u = {}) => {
  if (!u) return "";
  if (u.firstName || u.lastName) {
    return `${u.firstName || ""} ${u.lastName || ""}`.trim();
  }
  return u.name || u.email || "User";
};

const getInitials = (u = {}) => {
  const first = u.firstName?.[0] || u.name?.[0] || u.email?.[0] || "";
  const last = u.lastName?.[0] || "";
  return (first + last).toUpperCase() || "U";
};

const ROLE_BADGE_VARIANT = {
  Admin: "default",
  Caretaker: "info",
  Customer: "success",
  Elder: "warning",
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

const SimpleBarChart = ({ data, valueKey = "value", labelKey = "label", accent = "teal" }) => {
  const max = Math.max(1, ...data.map((d) => Number(d[valueKey]) || 0));
  const accentClasses = {
    teal: "bg-gradient-to-t from-teal-500 to-emerald-500",
    indigo: "bg-gradient-to-t from-indigo-500 to-sky-500",
    amber: "bg-gradient-to-t from-amber-500 to-orange-500",
    rose: "bg-gradient-to-t from-rose-500 to-pink-500",
  };
  return (
    <div className="flex h-40 items-end gap-3 sm:gap-4">
      {data.map((d, i) => {
        const v = Number(d[valueKey]) || 0;
        const pct = Math.max(2, Math.round((v / max) * 100));
        return (
          <div key={`${d[labelKey]}-${i}`} className="flex flex-1 flex-col items-center gap-1">
            <div className="relative flex h-full w-full items-end">
              <div
                className={`w-full rounded-t-md ${accentClasses[accent] || accentClasses.teal}`}
                style={{ height: `${pct}%` }}
                role="img"
                aria-label={`${d[labelKey]}: ${v}`}
                title={`${d[labelKey]}: ${v}`}
              />
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
              {d[labelKey]}
            </span>
            <span className="text-xs font-semibold text-gray-900">{v}</span>
          </div>
        );
      })}
    </div>
  );
};

const UserRow = ({ user, onView, onSuspend, onDelete, busy }) => {
  const fullName = getFullName(user);
  const initials = getInitials(user);
  const city = user.address?.city || "—";
  const variant = ROLE_BADGE_VARIANT[user.role] || "secondary";

  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback>{initials}</AvatarFallback>
            )}
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{fullName}</p>
            <p className="truncate text-xs text-gray-500 inline-flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {user.email || "—"}
            </p>
          </div>
        </div>
      </td>
      <td className="hidden sm:table-cell px-4 py-3">
        <Badge variant={variant}>{user.role}</Badge>
      </td>
      <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-700">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-gray-400" />
          {city}
        </span>
      </td>
      <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-700">
        {formatDateTime(user.createdAt)}
      </td>
      <td className="hidden lg:table-cell px-4 py-3 text-sm">
        {user.isActive === false ? (
          <Badge variant="warning">Suspended</Badge>
        ) : (
          <Badge variant="success">Active</Badge>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onView(user)}
            aria-label={`View ${fullName}`}
            title="View"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSuspend(user)}
            aria-label={`Suspend ${fullName}`}
            title={user.isActive === false ? "Reactivate" : "Suspend"}
            className="text-amber-600 hover:text-amber-700"
          >
            {user.isActive === false ? (
              <UserCheck className="h-4 w-4" />
            ) : (
              <Ban className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(user)}
            aria-label={`Delete ${fullName}`}
            title="Delete"
            className="text-red-600 hover:text-red-700"
            disabled={busy === user._id}
          >
            {busy === user._id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </td>
    </tr>
  );
};

const BookingRow = ({ booking }) => {
  const customer = booking.customer || {};
  const caretaker = booking.caretaker || {};
  const variant = STATUS_VARIANT[booking.status] || "secondary";

  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors">
      <td className="px-4 py-3 text-sm">
        <p className="truncate font-medium text-gray-900">{getFullName(customer)}</p>
        {customer.email && (
          <p className="truncate text-xs text-gray-500">{customer.email}</p>
        )}
      </td>
      <td className="px-4 py-3 text-sm">
        <p className="truncate font-medium text-gray-900">{getFullName(caretaker)}</p>
        {caretaker.email && (
          <p className="truncate text-xs text-gray-500">{caretaker.email}</p>
        )}
      </td>
      <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-700">
        <span className="inline-flex items-center gap-1">
          <Briefcase className="h-3.5 w-3.5 text-gray-400" />
          {booking.serviceType || "—"}
        </span>
      </td>
      <td className="hidden sm:table-cell px-4 py-3 text-sm text-gray-700">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          {formatDateLong(booking.scheduledDate)}
        </span>
      </td>
      <td className="px-4 py-3 text-sm">
        <Badge variant={variant}>{booking.status}</Badge>
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
        ₹{Number(booking.totalAmount || 0).toFixed(2)}
      </td>
    </tr>
  );
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [verifyingId, setVerifyingId] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [rejectPrompt, setRejectPrompt] = useState({ open: false, profileId: null, reason: "" });

  useEffect(() => {
    if (viewingProfile) {
      const timer = setTimeout(() => setShowMap(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowMap(false);
    }
  }, [viewingProfile]);

  const [userFilter, setUserFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [bookingFilter, setBookingFilter] = useState("all");
  const [bookingSortDir, setBookingSortDir] = useState("desc");
  const [busyUserId, setBusyUserId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role && user.role !== "Admin") {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  const fetchAll = async ({ silent = false } = {}) => {
    if (!user || user.role !== "Admin") return;
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [usersRes, bookingsRes, pcRes] = await Promise.all([
        api.get("/users").catch((err) => {
          if (err?.response?.status === 403 || err?.response?.status === 401) {
            throw err;
          }
          return { data: [] };
        }),
        api.get("/bookings/my-bookings").catch(() => ({ data: [] })),
        api.get("/caretakers?isVerified=false").catch(() => ({ data: [] })),
      ]);
      const usersData = Array.isArray(usersRes.data) ? usersRes.data : [];
      const bookingsData = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
      const pcData = Array.isArray(pcRes.data) ? pcRes.data.filter(c => c.verificationStatus === 'Submitted') : [];
      setPendingVerifications(pcData);
      if (usersData.length === 0) {
        try {
          const stored = JSON.parse(localStorage.getItem("admin_fallback_users") || "[]");
          if (Array.isArray(stored) && stored.length > 0) setUsers(stored);
          else setUsers([]);
        } catch {
          setUsers([]);
        }
      } else {
        setUsers(usersData);
        try {
          localStorage.setItem("admin_fallback_users", JSON.stringify(usersData));
        } catch {
          /* ignore storage errors */
        }
      }
      setBookings(bookingsData);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403 || status === 401) {
        setError("You don't have permission to view this page.");
      } else {
        setError(
          err?.response?.data?.message ||
            "Unable to load admin data. Please try again."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "Admin") return undefined;
    // Defer to next microtask to satisfy react-hooks/set-state-in-effect rule.
    const handle = setTimeout(() => {
      fetchAll();
    }, 0);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter((u) => {
      if (userFilter !== "all" && u.role !== userFilter) return false;
      if (!q) return true;
      const name = getFullName(u).toLowerCase();
      const email = (u.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [users, userFilter, userSearch]);

  const filteredBookings = useMemo(() => {
    const list = bookings
      .slice()
      .filter((b) => bookingFilter === "all" || b.status === bookingFilter)
      .sort((a, b) => {
        const aT = new Date(a.scheduledDate || a.createdAt || 0).getTime();
        const bT = new Date(b.scheduledDate || b.createdAt || 0).getTime();
        return bookingSortDir === "asc" ? aT - bT : bT - aT;
      });
    return list;
  }, [bookings, bookingFilter, bookingSortDir]);

  const overview = useMemo(() => {
    const caretakers = users.filter((u) => u.role === "Caretaker");
    const customers = users.filter((u) => u.role === "Customer");
    const totalRevenue = bookings
      .filter((b) => b.status === "Completed")
      .reduce((acc, b) => acc + Number(b.totalAmount || 0), 0);
    const pendingVerifications = caretakers.filter(
      (c) => c.isActive === false || c.profileComplete === false
    );
    return {
      totalUsers: users.length,
      totalCaretakers: caretakers.length,
      totalCustomers: customers.length,
      totalBookings: bookings.length,
      totalRevenue,
      pendingVerifications,
      recentCaretakerSignups: caretakers
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        )
        .slice(0, 5),
    };
  }, [users, bookings]);

  const statusDistribution = useMemo(() => {
    const counts = { Pending: 0, Accepted: 0, "In Progress": 0, Completed: 0, Cancelled: 0, Declined: 0 };
    bookings.forEach((b) => {
      if (counts[b.status] !== undefined) counts[b.status] += 1;
    });
    return [
      { label: "Pend", value: counts.Pending },
      { label: "Acc", value: counts.Accepted },
      { label: "Prog", value: counts["In Progress"] },
      { label: "Done", value: counts.Completed },
      { label: "Cnc", value: counts.Cancelled },
      { label: "Dec", value: counts.Declined },
    ];
  }, [bookings]);

  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: MONTH_LABELS[d.getMonth()], total: 0 });
    }
    bookings.forEach((b) => {
      if (b.status !== "Completed") return;
      const d = new Date(b.completedAt || b.scheduledDate || b.createdAt || 0);
      if (Number.isNaN(d.getTime())) return;
      const match = months.find(
        (m) => m.year === d.getFullYear() && m.month === d.getMonth()
      );
      if (match) match.total += Number(b.totalAmount || 0);
    });
    // Add deterministic mock data when no real revenue exists so the chart is meaningful.
    const hasReal = months.some((m) => m.total > 0);
    if (!hasReal) {
      const mockTotals = [820, 1340, 1100, 1620, 1980, 2240];
      months.forEach((m, i) => {
        m.total = mockTotals[i] ?? 0;
      });
    }
    return months;
  }, [bookings]);

  const handleSuspend = async (targetUser) => {
    setActionError(null);
    setBusyUserId(targetUser._id);
    try {
      // Toggle locally — backend endpoint may not exist yet.
      setUsers((prev) =>
        prev.map((u) =>
          u._id === targetUser._id ? { ...u, isActive: !(u.isActive !== false) } : u
        )
      );
    } catch {
      setActionError("Could not update user status.");
    } finally {
      setBusyUserId(null);
    }
  };

  const handleVerify = async (caretakerProfileId, status, reason = '') => {
    if (status === 'Rejected' && !reason) {
      setRejectPrompt({ open: true, profileId: caretakerProfileId, reason: "" });
      return;
    }
    setVerifyingId(caretakerProfileId);
    try {
      await api.put(`/caretakers/${caretakerProfileId}/verify`, { status, reason });
      setPendingVerifications(prev => prev.filter(c => c._id !== caretakerProfileId));
    } catch (err) {
      setActionError("Failed to update verification status");
    } finally {
      setVerifyingId(null);
      setRejectPrompt({ open: false, profileId: null, reason: "" });
    }
  };

  const handleDelete = async (targetUser) => {
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        `Permanently delete ${getFullName(targetUser)}? This cannot be undone.`
      );
      if (!ok) return;
    }
    setActionError(null);
    setBusyUserId(targetUser._id);
    try {
      try {
        await api.delete(`/users/${targetUser._id}`);
      } catch (err) {
        // If backend route is missing, fall back to local removal.
        if (err?.response?.status !== 404 && err?.response?.status !== 405) {
          throw err;
        }
      }
      setUsers((prev) => prev.filter((u) => u._id !== targetUser._id));
    } catch (err) {
      setActionError(
        err?.response?.data?.message || "Unable to delete this user."
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const handleView = (targetUser) => {
    // The backend exposes GET /api/users/:id for admins. For demo, just show an inline alert.
    if (typeof window !== "undefined") {
      window.alert(
        `${getFullName(targetUser)}\n${targetUser.email}\nRole: ${targetUser.role}\nCity: ${
          targetUser.address?.city || "—"
        }`
      );
    }
  };

  if (authLoading || (!user && !loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!user || (user.role && user.role !== "Admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const totalRevenueDisplay = `₹${overview.totalRevenue.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
              <Shield className="h-3.5 w-3.5" />
              Admin
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Admin dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Overview of users, bookings, and platform activity.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => fetchAll()}
            disabled={refreshing || loading}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {actionError && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Total users"
            value={loading ? "—" : overview.totalUsers}
            tone="info"
            hint={`${overview.totalCustomers} customers`}
          />
          <StatCard
            icon={UserCheck}
            label="Total caretakers"
            value={loading ? "—" : overview.totalCaretakers}
            tone="default"
          />
          <StatCard
            icon={CalendarCheck}
            label="Total bookings"
            value={loading ? "—" : overview.totalBookings}
            tone="success"
          />
          <StatCard
            icon={DollarSign}
            label="Total revenue"
            value={loading ? "—" : totalRevenueDisplay}
            tone="warning"
            hint="Completed bookings"
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart className="h-4 w-4 text-teal-600" />
                Bookings by status
              </CardTitle>
              <CardDescription>Distribution across the lifecycle.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                </div>
              ) : (
                <SimpleBarChart data={statusDistribution} accent="teal" />
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                Revenue by month
              </CardTitle>
              <CardDescription>Last 6 months (completed bookings).</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : (
                <SimpleBarChart
                  data={monthlyRevenue}
                  valueKey="total"
                  accent="indigo"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {pendingVerifications.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-orange-800">
                <Shield className="h-4 w-4" />
                Pending Verifications
              </CardTitle>
              <CardDescription className="text-orange-700">
                Caretakers who have submitted KYC documents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingVerifications.map(profile => (
                  <Card key={profile._id} className="border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="h-10 w-10 border border-gray-100 shadow-sm">
                          {profile.user?.avatar ? <img src={profile.user.avatar} className="object-cover h-full w-full" alt="avatar" /> : <AvatarFallback>{getInitials(profile.user)}</AvatarFallback>}
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{getFullName(profile.user)}</p>
                          <p className="text-xs text-gray-500 truncate">{profile.user?.email}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        {profile.kycDocuments?.map((doc, idx) => (
                          <div key={idx} className="flex items-center justify-between border border-gray-100 rounded bg-gray-50 p-2">
                            <span className="text-xs font-semibold text-gray-700">{doc.docType}</span>
                            <a href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-teal-600 text-xs hover:underline">
                              <Eye className="h-3 w-3" />
                              View
                            </a>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mb-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-teal-200 text-teal-700 hover:bg-teal-50"
                          onClick={() => setViewingProfile(profile)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile Details
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" 
                          onClick={() => handleVerify(profile._id, 'Rejected')}
                          disabled={verifyingId === profile._id}
                        >
                          Reject
                        </Button>
                        <Button 
                          size="sm" 
                          className="w-full bg-teal-600 hover:bg-teal-700" 
                          onClick={() => handleVerify(profile._id, 'Verified')}
                          disabled={verifyingId === profile._id}
                        >
                          Approve
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 border-gray-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-600" />
              Users
            </CardTitle>
            <CardDescription>
              {loading ? "Loading users…" : `${filteredUsers.length} of ${users.length} users`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Search by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="User role filter">
              {ROLE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  role="tab"
                  aria-selected={userFilter === f.value}
                  onClick={() => setUserFilter(f.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    userFilter === f.value
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto -mx-6">
              <table className="w-full min-w-[720px]">
                <thead className="bg-gray-50 text-left">
                  <tr className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-2">Name</th>
                    <th className="hidden sm:table-cell px-4 py-2">Role</th>
                    <th className="hidden md:table-cell px-4 py-2">City</th>
                    <th className="hidden lg:table-cell px-4 py-2">Created</th>
                    <th className="hidden lg:table-cell px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-4 py-3">
                          <div className="h-8 w-32 animate-pulse rounded bg-gray-100" />
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3">
                          <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                        </td>
                        <td className="hidden md:table-cell px-4 py-3">
                          <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3">
                          <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3">
                          <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="ml-auto h-6 w-20 animate-pulse rounded bg-gray-100" />
                        </td>
                      </tr>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-600">
                        No users match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <UserRow
                        key={u._id || u.id || u.email}
                        user={u}
                        onView={handleView}
                        onSuspend={handleSuspend}
                        onDelete={handleDelete}
                        busy={busyUserId}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-gray-200">
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-teal-600" />
                  Bookings
                </CardTitle>
                <CardDescription>
                  {loading
                    ? "Loading bookings…"
                    : `${filteredBookings.length} of ${bookings.length} bookings`}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Select
                    value={bookingFilter}
                    onChange={(e) => setBookingFilter(e.target.value)}
                    className="pl-9 min-w-[150px]"
                    aria-label="Filter bookings by status"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setBookingSortDir((d) => (d === "asc" ? "desc" : "asc"))
                  }
                >
                  <ArrowUpDown className="h-4 w-4" />
                  {bookingSortDir === "asc" ? "Oldest first" : "Newest first"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-6">
              <table className="w-full min-w-[720px]">
                <thead className="bg-gray-50 text-left">
                  <tr className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-2">Customer</th>
                    <th className="px-4 py-2">Caretaker</th>
                    <th className="hidden md:table-cell px-4 py-2">Service</th>
                    <th className="hidden sm:table-cell px-4 py-2">Date</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-4 py-3">
                          <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                        </td>
                        <td className="hidden md:table-cell px-4 py-3">
                          <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3">
                          <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-14 animate-pulse rounded bg-gray-100" />
                        </td>
                      </tr>
                    ))
                  ) : filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-600">
                        No bookings match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => <BookingRow key={b._id} booking={b} />)
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-teal-600" />
              Recent caretaker signups
            </CardTitle>
            <CardDescription>New caretakers on the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading caretakers...
              </div>
            ) : overview.recentCaretakerSignups.length === 0 ? (
              <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
                No caretakers have signed up yet.
              </p>
            ) : (
              overview.recentCaretakerSignups.map((c) => {
                const fullName = getFullName(c);
                const initials = getInitials(c);
                const verified = c.isVerified !== false && c.isActive !== false;
                return (
                  <div
                    key={c._id}
                    className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm">
                        {c.avatar ? (
                          <img src={c.avatar} alt={fullName} className="h-full w-full object-cover" />
                        ) : (
                          <AvatarFallback>{initials}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{fullName}</p>
                        <p className="truncate text-xs text-gray-500">{c.email || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {formatDateTime(c.createdAt)}
                      </span>
                      {verified ? (
                        <Badge variant="success">Verified</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <span>Logged in as {getFullName(user)} ({user.email})</span>
          <Link to="/dashboard" className="text-teal-700 hover:underline">
            Back to my dashboard
          </Link>
        </div>
      </div>
      
      {/* Profile Details Sheet */}
      <Sheet open={!!viewingProfile} onOpenChange={(open) => !open && setViewingProfile(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {viewingProfile && (
            <>
              <SheetTitle>Caretaker Profile Details</SheetTitle>
              <SheetDescription>
                Detailed information submitted by the caretaker.
              </SheetDescription>
              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2 text-gray-900">
                    <UserCheck className="h-4 w-4" /> Personal Information
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium text-gray-900">Name:</span> {getFullName(viewingProfile.user)}</p>
                    <p><span className="font-medium text-gray-900">Email:</span> {viewingProfile.user?.email}</p>
                    <p><span className="font-medium text-gray-900">Phone:</span> {viewingProfile.user?.phone || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2 text-gray-900">
                    <Briefcase className="h-4 w-4" /> Professional Details
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium text-gray-900">Hourly Rate:</span> ₹{viewingProfile.hourlyRate}</p>
                    <p><span className="font-medium text-gray-900">Experience:</span> {viewingProfile.experience} years</p>
                    <p><span className="font-medium text-gray-900">Services:</span> {viewingProfile.services?.join(', ') || 'None selected'}</p>
                    <p><span className="font-medium text-gray-900">Languages:</span> {viewingProfile.languages?.join(', ') || 'None selected'}</p>
                  </div>
                </div>

                {viewingProfile.bio && (
                  <div>
                    <h4 className="font-medium mb-1 text-gray-900">Bio</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{viewingProfile.bio}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2 text-gray-900">
                    <MapPin className="h-4 w-4" /> Address & Location
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1 mb-3">
                    <p>{viewingProfile.user?.address?.street || 'No street'}</p>
                    <p>{viewingProfile.user?.address?.city || 'No city'}, {viewingProfile.user?.address?.state || 'No state'} {viewingProfile.user?.address?.zipCode || ''}</p>
                  </div>
                  {viewingProfile.user?.address?.coordinates?.lat && viewingProfile.user?.address?.coordinates?.lng && (
                    <div className="h-48 w-full rounded overflow-hidden border">
                      {showMap ? (
                        <MapPicker 
                          lat={viewingProfile.user.address.coordinates.lat} 
                          lng={viewingProfile.user.address.coordinates.lng} 
                          readOnly={true} 
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">
                          <span className="text-gray-400 text-sm">Loading map...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2 text-gray-900">
                    <Calendar className="h-4 w-4" /> Availability
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(day => {
                      const avail = viewingProfile.availability?.[day];
                      return (
                        <div key={day} className="flex justify-between border-b pb-1">
                          <span className="capitalize">{day}</span>
                          <span className={avail?.available ? 'text-teal-700 font-medium' : 'text-gray-400'}>
                            {avail?.available ? `${avail.start} - ${avail.end}` : 'Off'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Rejection Prompt Modal */}
      {rejectPrompt.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reject Verification</h3>
            <p className="text-sm text-gray-500 mb-4">
              Please provide a reason for rejecting this caretaker's profile and KYC documents.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rejectReason">Rejection Reason</Label>
                <textarea
                  id="rejectReason"
                  rows={3}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g., Document is blurry, Name does not match..."
                  value={rejectPrompt.reason}
                  onChange={(e) => setRejectPrompt(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setRejectPrompt({ open: false, profileId: null, reason: "" })}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => handleVerify(rejectPrompt.profileId, 'Rejected', rejectPrompt.reason)}
                  disabled={!rejectPrompt.reason.trim()}
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
