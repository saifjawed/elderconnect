import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Mail, Lock, Loader2, AlertCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/useAuth";
import Logo from "@/components/Logo";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
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

    if (!formData.email.trim() || !formData.password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      await login(formData.email.trim(), formData.password);
      navigate("/");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Invalid email or password. Please try again.";
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

      <div className="relative w-full max-w-md">
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
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your NestLife account</CardDescription>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-xs font-medium text-teal-600 hover:text-teal-700">
                    Forgot?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
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

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>

              <p className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                >
                  Create one
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-gray-500">
          By signing in, you agree to our{" "}
          <a href="#" className="underline hover:text-gray-700">Terms</a> and{" "}
          <a href="#" className="underline hover:text-gray-700">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
