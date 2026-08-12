import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  User,
  Phone,
  UserCircle,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Logo from "@/components/Logo";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/contexts/useAuth";
import MapPicker from "@/components/MapPicker";

const ROLES = [
  { value: "Customer", label: "Customer (looking to book care)" },
  { value: "Caretaker", label: "Caretaker (providing care services)" },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "Customer",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    lat: null,
    lng: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const required = ["firstName", "lastName", "email", "phone", "password", "confirmPassword", "role"];
    for (const field of required) {
      if (!String(formData[field] || "").trim()) {
        setError(`Please fill in the ${field.replace(/([A-Z])/g, " $1").toLowerCase()} field.`);
        return;
      }
    }

    if (formData.role === "Caretaker") {
      const caretakerRequired = ["street", "city", "state", "zipCode"];
      for (const field of caretakerRequired) {
        if (!String(formData[field] || "").trim()) {
          setError(`Please fill in the Caretaker ${field} field.`);
          return;
        }
      }
      if (formData.lat === null || formData.lng === null) {
        setError("Please choose your caretaker location on the map.");
        return;
      }
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      // eslint-disable-next-line no-unused-vars
      const { confirmPassword, street, city, state, zipCode, lat, lng, ...payload } = formData;
      
      if (formData.role === "Caretaker") {
        payload.address = {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          zipCode: zipCode.trim(),
          coordinates: {
            lat: lat ? Number(lat) : null,
            lng: lng ? Number(lng) : null
          }
        };
      }

      await register(payload);
      navigate("/");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to create account. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-emerald-50 px-4 py-12 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(20,184,166,0.15) 0, transparent 50%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.15) 0, transparent 50%)",
        }}
      />

      <div className="relative w-full max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>

        <div className="flex justify-center mb-6">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-10 w-10" />
            <span className="text-2xl font-bold text-gray-900">NestLife</span>
          </Link>
        </div>

        <Card className="shadow-xl border-gray-200">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>
              Join NestLife to find care or offer your services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      placeholder="Jane"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={loading}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">I am a</Label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                  <Select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    className="pl-10"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {formData.role === "Caretaker" && (
                <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <MapPin className="h-4 w-4 text-teal-600" />
                    Caretaker Location Details
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      name="street"
                      type="text"
                      placeholder="123 Care Lane"
                      value={formData.street}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        type="text"
                        placeholder="San Francisco"
                        value={formData.city}
                        onChange={handleChange}
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        name="state"
                        type="text"
                        placeholder="CA"
                        value={formData.state}
                        onChange={handleChange}
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        type="text"
                        placeholder="94110"
                        value={formData.zipCode}
                        onChange={handleChange}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Choose Location on Map</Label>
                    <MapPicker
                      lat={formData.lat}
                      lng={formData.lng}
                      onChange={(lat, lng) =>
                        setFormData((prev) => ({ ...prev, lat, lng }))
                      }
                    />
                    <p className="text-[10px] text-gray-500">
                      Click on the map or click the locate icon to set your coordinate location.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-gray-500">
          By creating an account, you agree to our{" "}
          <a href="#" className="underline hover:text-gray-700">Terms</a> and{" "}
          <a href="#" className="underline hover:text-gray-700">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
