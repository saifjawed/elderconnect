import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import {
  Shield,
  Clock,
  Map,
  Star,
  Users,
  ArrowRight,
  Search,
  CheckCircle2,
  Sparkles,
  HeartHandshake,
  Phone,
  Mail,
  Calendar,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";

const features = [
  {
    icon: Shield,
    title: "Verified Caretakers",
    description:
      "Every caretaker is background-checked, ID-verified, and reviewed by families to ensure your loved ones are in safe hands.",
    color: "from-teal-500 to-emerald-600",
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description:
      "Book hourly, overnight, or live-in care. Our network of caretakers is available around the clock when you need them most.",
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: Map,
    title: "Find Care Nearby",
    description:
      "Browse caretakers in your area with detailed profiles, languages spoken, specialties, and verified reviews from other families.",
    color: "from-rose-500 to-pink-600",
  },
];

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Search & Browse",
    description:
      "Filter by location, schedule, language, and care needs to find the perfect match for your family.",
  },
  {
    icon: Calendar,
    step: "02",
    title: "Book & Schedule",
    description:
      "Pick a time that works for you. Confirm your booking with secure payments and instant confirmation.",
  },
  {
    icon: HeartHandshake,
    step: "03",
    title: "Care with Confidence",
    description:
      "Meet your caretaker, track visits in real-time, and rate the experience to help other families.",
  },
];

const stats = [
  { value: "5,000+", label: "Verified Caretakers" },
  { value: "20,000+", label: "Happy Families" },
  { value: "50+", label: "Cities Covered" },
  { value: "4.9", label: "Average Rating" },
];

const REVIEWS = [
  {
    rating: 5,
    title: "Care that feels like family",
    comment: "“NestLife helped us find a wonderful caretaker for my father. The booking was effortless, and the real-time updates gave us complete peace of mind.”",
    name: "Priya S.",
    role: "Family member"
  },
  {
    rating: 5,
    title: "Very professional and caring",
    comment: "“Anjali was wonderful with my mother. Very professional and caring. The daily logs were extremely detailed and communicative.”",
    name: "Rahul M.",
    role: "Family member"
  },
  {
    rating: 5,
    title: "Lifesaver for our family",
    comment: "“Finding a caregiver who understood dementia was tough until we used NestLife. The platform matched us with a certified specialist in hours.”",
    name: "Neha K.",
    role: "Daughter"
  }
];

const LandingPage = () => {
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentReviewIndex((prev) => (prev + 1) % REVIEWS.length);
        setFade(true);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeReview = REVIEWS[currentReviewIndex];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-emerald-50">
        <div
          className="absolute inset-0 opacity-30"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(20,184,166,0.15) 0, transparent 50%), radial-gradient(circle at 80% 30%, rgba(16,185,129,0.15) 0, transparent 50%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-4 py-1.5 text-sm font-medium text-teal-700 mb-6">
                <Sparkles className="h-4 w-4" />
                Trusted by 20,000+ families
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Compassionate care for{" "}
                <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  your loved ones
                </span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-gray-600 max-w-xl">
                Connect with verified, background-checked caretakers in your area. From a few hours
                a day to round-the-clock support, find the perfect match for your family's needs.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={() => {
                    if (user && user.role === "Customer") {
                      navigate("/search");
                    } else {
                      navigate("/register");
                    }
                  }}
                  className="transition-all duration-300 transform hover:scale-[1.03] active:scale-95 hover:shadow-lg hover:bg-teal-700"
                >
                  <Search className="h-5 w-5" />
                  Find a Caretaker
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/register")}
                  className="transition-all duration-300 transform hover:scale-[1.03] active:scale-95 hover:shadow-md hover:bg-teal-50"
                >
                  <Briefcase className="h-5 w-5" />
                  Become a Caretaker
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                  Background-checked
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                  Verified reviews
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                  Secure payments
                </div>
              </div>
            </div>

            {/* Hero illustration card */}
            <div className="relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="absolute -top-6 -left-6 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl" aria-hidden="true" />
                <div className="absolute -bottom-6 -right-6 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" aria-hidden="true" />
                <Card className="relative border-0 shadow-2xl transition-all duration-500 transform hover:scale-[1.02] hover:shadow-[0_25px_50px_-12px_rgba(20,184,166,0.2)]">
                  <CardContent className="p-8">
                    <div className={`transition-all duration-300 transform ${fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
                      <div className="flex items-center gap-4 mb-6">
                        <Logo className="h-14 w-14" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{activeReview.title}</h3>
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(activeReview.rating)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                            ))}
                            <span className="text-xs text-gray-500 ml-1">{activeReview.rating.toFixed(1)} / 5</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-650 italic leading-relaxed min-h-[85px]">
                        {activeReview.comment}
                      </p>
                      <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between text-sm">
                        <span className="font-semibold text-gray-900">{activeReview.name}</span>
                        <span className="text-gray-500">{activeReview.role}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-y border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center md:text-left">
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-gray-600">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="find" className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why families choose NestLife
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to find, book, and manage trusted elder care — all in one place.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="border-gray-200 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 transform-gpu cursor-default"
                >
                  <CardContent className="p-8">
                    <div
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-md mb-5`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How NestLife works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Getting started takes just a few minutes. Here's what to expect.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full blur-xl opacity-30" aria-hidden="true" />
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg">
                        <Icon className="h-7 w-7" />
                      </div>
                    </div>
                    <span className="mt-4 text-sm font-bold text-teal-600 tracking-wider">
                      STEP {step.step}
                    </span>
                    <h3 className="mt-2 text-xl font-semibold text-gray-900">{step.title}</h3>
                    <p className="mt-3 text-gray-600 max-w-xs">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-700 px-8 py-16 md:px-16 md:py-20 shadow-2xl">
            <div
              className="absolute inset-0 opacity-20"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.4) 0, transparent 50%)",
              }}
            />
            <div className="relative grid items-center gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  Ready to find the right caretaker?
                </h2>
                <p className="mt-4 text-lg text-teal-100">
                  Join thousands of families who trust NestLife to care for the people they love most.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 md:justify-end">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    if (user && user.role === "Customer") {
                      navigate("/search");
                    } else {
                      navigate("/register");
                    }
                  }}
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-teal-700"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Logo className="h-9 w-9" />
                <span className="text-xl font-bold text-white">NestLife</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Compassionate, verified elder care for the people you love most.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Safety</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  hello@nestlife.app
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  1-800-ELDERLY
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Community
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} NestLife. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
