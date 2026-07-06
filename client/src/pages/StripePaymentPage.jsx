import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Info,
  Loader2,
  Lock,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  StickyNote,
  User as UserIcon,
} from "lucide-react";
import {
  Elements,
  CardElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
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

const STRIPE_PUBLISHABLE_KEY =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_demo_key";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const CARD_ELEMENT_OPTIONS = {
  hidePostalCode: false,
  style: {
    base: {
      fontSize: "15px",
      color: "#0f172a",
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      "::placeholder": {
        color: "#94a3b8",
      },
      iconColor: "#0d9488",
    },
    invalid: {
      color: "#b91c1c",
      iconColor: "#b91c1c",
    },
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

const PaymentForm = ({ booking, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!stripe || !elements) {
      setError("Stripe is still loading. Please try again in a moment.");
      return;
    }
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card form is not ready. Please refresh and try again.");
      return;
    }

    setSubmitting(true);
    // Simulate client-side processing. The CardElement never creates a real
    // charge in this demo environment (no payment intent), so we wrap the
    // simulated delay in a try/catch and never block on Stripe.
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // For demo realism, randomly simulate a failure 0% of the time. We keep
      // the path here so future toggles (env flag, etc.) can demonstrate the
      // failure UI without code changes.
      const shouldFail = false;
      if (shouldFail) {
        throw new Error("Your card was declined. Please try another payment method.");
      }
      onSuccess?.();
    } catch (err) {
      setError(err.message || "Payment could not be completed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <label
          htmlFor="card-element"
          className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-800"
        >
          <CreditCard className="h-4 w-4 text-teal-600" />
          Card details
        </label>
        <div id="card-element" className="rounded-md border border-gray-200 px-3 py-3">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        <p className="mt-2 inline-flex items-start gap-1 text-xs text-gray-500">
          <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          Your payment is encrypted and securely processed by Stripe.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={submitting || !stripe || !elements}
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
        {submitting ? "Processing..." : `Pay ₹${Number(booking.totalAmount || 0).toFixed(2)}`}
      </Button>
    </form>
  );
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
          <div className="rounded-md border border-gray-100 p-3 sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> Address
            </dt>
            <dd className="mt-1 font-medium text-gray-900">
              {booking.address
                ? [booking.address.street, booking.address.city, booking.address.state]
                    .filter(Boolean)
                    .join(", ")
                : "Address unavailable"}
            </dd>
          </div>
          {booking.notes && (
            <div className="rounded-md border border-gray-100 p-3 sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 flex items-center gap-1">
                <StickyNote className="h-3.5 w-3.5" /> Notes
              </dt>
              <dd className="mt-1 text-sm text-gray-700 break-words">{booking.notes}</dd>
            </div>
          )}
        </dl>

        <div className="rounded-md border border-teal-200 bg-teal-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-teal-900">Total amount</span>
            <span className="text-2xl font-bold text-teal-700">
              ₹{Number(booking.totalAmount || 0).toFixed(2)}
            </span>
          </div>
          <p className="mt-1 text-xs text-teal-800 inline-flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Demo checkout — no real charge will be made.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const SuccessPanel = ({ booking, onRetry }) => {
  const navigate = useNavigate();
  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
      <CardContent className="p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Payment Successful!</h2>
        <p className="mt-1 text-sm text-gray-600">
          Your booking with{" "}
          <span className="font-medium text-gray-900">
            {getName(booking.caretaker, "the caretaker")}
          </span>{" "}
          is confirmed. A receipt has been emailed to you.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-emerald-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          Payment ID: DEMO-{booking._id?.slice(-8)?.toUpperCase() || "00000000"}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={() => navigate("/dashboard")}>
            <Sparkles className="h-4 w-4" />
            Go to dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate("/my-bookings")}>
            <ArrowRight className="h-4 w-4" />
            My bookings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const FailedPanel = ({ onRetry }) => {
  const navigate = useNavigate();
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="mt-3 text-xl font-bold text-gray-900">Payment failed</h2>
        <p className="mt-1 text-sm text-gray-600">
          We couldn't process your payment. No charges were made.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button onClick={onRetry}>
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button variant="outline" onClick={() => navigate("/my-bookings")}>
            Back to bookings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const TestCardNotice = () => (
  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
    <p className="flex items-start gap-2">
      <Info className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
      <span>
        <span className="font-semibold">Test mode.</span> Use card{" "}
        <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] text-amber-900 border border-amber-200">
          4242 4242 4242 4242
        </code>
        , any future date, any CVC, and any ZIP code.
      </span>
    </p>
  </div>
);

const StripePaymentPage = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const { user, loading: authLoading } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stage, setStage] = useState("form"); // 'form' | 'success' | 'failed'

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

  const handleSuccess = () => {
    if (booking) {
      setBooking((prev) => (prev ? { ...prev, paymentStatus: "Paid" } : prev));
    }
    setStage("success");
  };

  const handleRetry = () => {
    setStage("form");
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
              <TestCardNotice />
            </div>
            <div className="order-1 lg:order-2">
              {stage === "success" ? (
                <SuccessPanel booking={booking} onRetry={() => navigate("/dashboard")} />
              ) : stage === "failed" ? (
                <FailedPanel onRetry={handleRetry} />
              ) : (
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-teal-600" />
                      Pay as {getName(user, "guest")}
                    </CardTitle>
                    <CardDescription>
                      Stripe will simulate the transaction. No real card is charged.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Elements stripe={stripePromise}>
                      <PaymentForm booking={booking} onSuccess={handleSuccess} />
                    </Elements>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-wide text-gray-500">
                      <div className="rounded border border-gray-100 bg-gray-50 px-2 py-2">
                        256-bit encryption
                      </div>
                      <div className="rounded border border-gray-100 bg-gray-50 px-2 py-2">
                        PCI compliant
                      </div>
                      <div className="rounded border border-gray-100 bg-gray-50 px-2 py-2">
                        Powered by Stripe
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

export default StripePaymentPage;
