import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  User as UserIcon,
  CheckCircle2,
  RefreshCw,
  Info
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
import Navbar from "@/components/Navbar";

// Razorpay test mode key should be provided by env
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

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

const formatDateLong = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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

const STATUS_VARIANT = {
  Pending: "warning",
  Accepted: "info",
  "In Progress": "info",
  Completed: "success",
  Cancelled: "secondary",
  Declined: "destructive",
};

const BookingSummary = ({ booking }) => {
  const caretaker = booking.caretaker || {};
  const caretakerName = getName(caretaker, "Caretaker");
  const initials = getInitials(caretaker, "C");
  const statusVariant = STATUS_VARIANT[booking.status] || "secondary";

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-teal-600" />
          Booking summary
        </CardTitle>
        <CardDescription>Review what you are paying for.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
            {caretaker.avatar ? (
              <img src={caretaker.avatar} alt={caretakerName} className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback>{initials}</AvatarFallback>
            )}
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{caretakerName}</p>
            <p className="truncate text-xs text-gray-500">
              {booking.serviceType || "Service"}
            </p>
          </div>
          <Badge variant={statusVariant} className="ml-auto">
            {booking.status}
          </Badge>
        </div>

        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-md border border-gray-100 p-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Date
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {formatDateLong(booking.scheduledDate)}
            </dd>
          </div>
          <div className="rounded-md border border-gray-100 p-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Time
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {formatTime12h(booking.startTime)} – {formatTime12h(booking.endTime)}
            </dd>
          </div>
        </dl>
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <p className="font-semibold text-gray-900">Total amount</p>
          <p className="text-xl font-bold text-teal-700">
            ₹{Number(booking.totalAmount || 0).toFixed(2)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const SuccessPanel = ({ booking, onRetry }) => (
  <Card className="border-teal-200 bg-teal-50 h-full flex flex-col items-center justify-center text-center p-8">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-teal-600 shadow-sm">
      <CheckCircle2 className="h-8 w-8" />
    </div>
    <h2 className="mt-4 text-xl font-bold text-gray-900">Payment successful!</h2>
    <p className="mt-2 text-sm text-gray-600">
      Your payment of ₹{Number(booking.totalAmount || 0).toFixed(2)} has been securely processed.
    </p>
    <Button className="mt-6 bg-teal-600 hover:bg-teal-700" onClick={onRetry}>
      Back to my bookings
    </Button>
  </Card>
);

const RazorpayPaymentPage = () => {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stage, setStage] = useState("form");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || !bookingId) return undefined;
    let cancelled = false;
    const fetchBooking = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        if (cancelled) return;
        setBooking(res.data);
      } catch (err) {
        if (cancelled) return;
        setError(
          err?.response?.data?.message ||
            "Unable to load this booking. Please try again."
        );
        setBooking(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBooking();
    return () => {
      cancelled = true;
    };
  }, [user, bookingId]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!booking) return;
    
    setSubmitting(true);
    setError(null);

    try {
      const res = await loadRazorpayScript();
      if (!res) {
        setError("Razorpay SDK failed to load. Are you online?");
        setSubmitting(false);
        return;
      }

      // Create order
      const orderRes = await api.post("/payments/razorpay/order", {
        bookingId: booking._id
      });
      const order = orderRes.data;

      const options = {
        key: order.key_id, // RAZORPAY_KEY_ID from backend
        amount: order.amount,
        currency: order.currency,
        name: "NestLife",
        description: `Payment for booking ${booking._id}`,
        order_id: order.order_id,
        handler: async function (response) {
          try {
            await api.post("/payments/razorpay/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id
            });
            
            setBooking((prev) => (prev ? { ...prev, paymentStatus: "Paid" } : prev));
            setStage("success");
          } catch (err) {
            setError(err.response?.data?.message || "Payment verification failed.");
          }
        },
        prefill: {
          name: getName(user),
          email: user.email || "",
          contact: user.phone || ""
        },
        theme: {
          color: "#0d9488"
        }
      };

      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on("payment.failed", function (response) {
        setError(response.error.description || "Payment failed.");
      });

      paymentObject.open();

    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong while initiating payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const caretakerName = useMemo(
    () => (booking ? getName(booking.caretaker, "Caretaker") : ""),
    [booking]
  );

  if (authLoading || (!user && !loading)) {
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

        <div className="mb-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
            <CreditCard className="h-3.5 w-3.5" />
            Secure checkout
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Complete your payment
          </h1>
          {booking && (
            <p className="mt-1 text-sm text-gray-600">
              Paying for booking with {caretakerName}.
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : error || !booking ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h2 className="mt-3 text-lg font-semibold text-gray-900">
                We couldn't load this booking
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {error || "This booking may have been removed."}
              </p>
              <Button className="mt-4" variant="outline" onClick={() => navigate("/my-bookings")}>
                Back to my bookings
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="space-y-4 order-2 lg:order-1">
              <BookingSummary booking={booking} />
              
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900">Razorpay Test Mode</h3>
                    <p className="mt-1 text-xs text-blue-800">
                      You are using Razorpay Test Mode. Feel free to use test card credentials or UPI handles when prompted. No real money will be deducted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              {stage === "success" ? (
                <SuccessPanel booking={booking} onRetry={() => navigate("/dashboard")} />
              ) : (
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-teal-600" />
                      Pay as {getName(user, "guest")}
                    </CardTitle>
                    <CardDescription>
                      Securely process your payment using Razorpay.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    
                    <Button
                      type="button"
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                      size="lg"
                      disabled={submitting}
                      onClick={handlePayment}
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                      {submitting ? "Processing..." : `Pay ₹${Number(booking.totalAmount || 0).toFixed(2)}`}
                    </Button>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-wide text-gray-500">
                      <div className="rounded border border-gray-100 bg-gray-50 px-2 py-2">
                        256-bit encryption
                      </div>
                      <div className="rounded border border-gray-100 bg-gray-50 px-2 py-2">
                        PCI compliant
                      </div>
                      <div className="rounded border border-gray-100 bg-gray-50 px-2 py-2">
                        Powered by Razorpay
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RazorpayPaymentPage;
