import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Search as SearchIcon,
  Map as MapIcon,
  SlidersHorizontal,
  X,
  Users,
  AlertCircle,
  Sparkles,
  ArrowUpDown,
} from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/contexts/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import Navbar from "@/components/Navbar";
import CaretakerCard from "@/components/CaretakerCard";
import StarRating from "@/components/StarRating";

const SERVICE_OPTIONS = [
  "Health Check-up",
  "Companionship",
  "Meal Preparation",
  "Mobility Assistance",
  "Medication Management",
  "Errands",
];

const LANGUAGE_OPTIONS = [
  "English",
  "Spanish",
  "Mandarin",
  "French",
  "Hindi",
  "Portuguese",
  "Arabic",
  "German",
];

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Highest Rated" },
  { value: "price-asc", label: "Lowest Price" },
  { value: "experience", label: "Most Experienced" },
];

const SAMPLE_CARETAKERS = [
  {
    _id: "sample-1",
    user: {
      firstName: "Maria",
      lastName: "Rodriguez",
      address: { city: "San Francisco", coordinates: { lat: 37.7749, lng: -122.4194 } },
    },
    services: ["Health Check-up", "Medication Management"],
    hourlyRate: 35,
    experience: 8,
    cities: ["San Francisco", "Oakland"],
    languages: ["English", "Spanish"],
    rating: 4.9,
    totalReviews: 142,
    isVerified: true,
  },
  {
    _id: "sample-2",
    user: {
      firstName: "James",
      lastName: "Chen",
      address: { city: "Seattle", coordinates: { lat: 47.6062, lng: -122.3321 } },
    },
    services: ["Companionship", "Meal Preparation", "Errands"],
    hourlyRate: 28,
    experience: 5,
    cities: ["Seattle"],
    languages: ["English", "Mandarin"],
    rating: 4.8,
    totalReviews: 89,
    isVerified: true,
  },
  {
    _id: "sample-3",
    user: {
      firstName: "Aisha",
      lastName: "Patel",
      address: { city: "New York", coordinates: { lat: 40.7128, lng: -74.006 } },
    },
    services: ["Mobility Assistance", "Companionship"],
    hourlyRate: 42,
    experience: 12,
    cities: ["New York", "Brooklyn", "Queens"],
    languages: ["English", "Hindi"],
    rating: 4.7,
    totalReviews: 201,
    isVerified: false,
  },
  {
    _id: "sample-4",
    user: {
      firstName: "Robert",
      lastName: "Johnson",
      address: { city: "Austin", coordinates: { lat: 30.2672, lng: -97.7431 } },
    },
    services: ["Health Check-up", "Mobility Assistance"],
    hourlyRate: 32,
    experience: 6,
    cities: ["Austin"],
    languages: ["English"],
    rating: 4.6,
    totalReviews: 54,
    isVerified: true,
  },
  {
    _id: "sample-5",
    user: {
      firstName: "Sofia",
      lastName: "Martinez",
      address: { city: "Miami", coordinates: { lat: 25.7617, lng: -80.1918 } },
    },
    services: ["Meal Preparation", "Errands", "Companionship"],
    hourlyRate: 26,
    experience: 3,
    cities: ["Miami"],
    languages: ["English", "Spanish", "Portuguese"],
    rating: 4.5,
    totalReviews: 31,
    isVerified: true,
  },
  {
    _id: "sample-6",
    user: {
      firstName: "David",
      lastName: "Kim",
      address: { city: "Chicago", coordinates: { lat: 41.8781, lng: -87.6298 } },
    },
    services: ["Medication Management", "Health Check-up"],
    hourlyRate: 38,
    experience: 9,
    cities: ["Chicago"],
    languages: ["English", "Korean"],
    rating: 4.9,
    totalReviews: 117,
    isVerified: true,
  },
];

const DEFAULT_FILTERS = {
  serviceType: "",
  city: "",
  minRating: 0,
  minRate: "",
  maxRate: "",
  language: "",
  verifiedOnly: false,
  search: "",
};

const buildQueryString = (filters) => {
  const params = new URLSearchParams();
  if (filters.serviceType) params.set("service", filters.serviceType);
  if (filters.city) params.set("city", filters.city);
  if (filters.minRating) params.set("minRating", filters.minRating);
  if (filters.minRate) params.set("minRate", filters.minRate);
  if (filters.maxRate) params.set("maxRate", filters.maxRate);
  if (filters.language) params.set("language", filters.language);
  if (filters.verifiedOnly) params.set("isVerified", "true");
  return params.toString();
};

const FilterContent = ({
  filters,
  setFilters,
  cities,
  onClear,
  onApply,
  variant = "sidebar",
}) => {
  const handleChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const isSidebar = variant === "sidebar";

  return (
    <div className={isSidebar ? "space-y-5" : "space-y-5 p-1"}>
      {isSidebar && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <p className="text-xs text-gray-500">Refine your search</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="serviceType">Service Type</Label>
        <Select
          id="serviceType"
          value={filters.serviceType}
          onChange={(e) => handleChange("serviceType", e.target.value)}
        >
          <option value="">All services</option>
          {SERVICE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        {cities.length > 0 ? (
          <Select
            id="city"
            value={filters.city}
            onChange={(e) => handleChange("city", e.target.value)}
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            id="city"
            type="text"
            placeholder="e.g. San Francisco"
            value={filters.city}
            onChange={(e) => handleChange("city", e.target.value)}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label>Minimum Rating</Label>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <StarRating
            rating={Number(filters.minRating) || 0}
            onRate={(value) =>
              handleChange(
                "minRating",
                filters.minRating === value ? 0 : value
              )
            }
            size="md"
          />
          <p className="mt-1 text-xs text-gray-500">
            {filters.minRating
              ? `${filters.minRating} stars & up`
              : "Any rating"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Hourly Rate (₹)</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="Min"
            value={filters.minRate}
            onChange={(e) => handleChange("minRate", e.target.value)}
          />
          <Input
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="Max"
            value={filters.maxRate}
            onChange={(e) => handleChange("maxRate", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="language">Language</Label>
        <Select
          id="language"
          value={filters.language}
          onChange={(e) => handleChange("language", e.target.value)}
        >
          <option value="">Any language</option>
          {LANGUAGE_OPTIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          id="verifiedOnly"
          type="checkbox"
          checked={filters.verifiedOnly}
          onChange={(e) => handleChange("verifiedOnly", e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
        />
        <Label htmlFor="verifiedOnly" className="cursor-pointer">
          Verified caretakers only
        </Label>
      </div>

      {!isSidebar && (
        <Button className="w-full" onClick={onApply}>
          Apply filters
        </Button>
      )}
    </div>
  );
};

const SkeletonCard = () => (
  <Card className="border-gray-200">
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
      <div className="mt-4 h-12 animate-pulse rounded-lg bg-gray-100" />
      <div className="mt-4 space-y-2">
        <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="mt-5 flex gap-2">
        <div className="h-9 flex-1 animate-pulse rounded-md bg-gray-100" />
        <div className="h-9 flex-1 animate-pulse rounded-md bg-gray-100" />
      </div>
    </CardContent>
  </Card>
);

const EmptyState = ({ onClear }) => (
  <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gradient-to-br from-teal-50/50 to-emerald-50/30 px-6 py-16 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 shadow-md">
      <Users className="h-8 w-8 text-white" />
    </div>
    <h3 className="mt-4 text-xl font-semibold text-gray-900">
      No caretakers found
    </h3>
    <p className="mt-2 max-w-md text-sm text-gray-600">
      We couldn't find any caretakers matching your filters. Try adjusting
      your criteria or clearing filters to see more results.
    </p>
    <Button variant="outline" className="mt-6" onClick={onClear}>
      <Sparkles className="h-4 w-4" />
      Clear filters
    </Button>
  </div>
);

const MapPanel = ({ caretakers, elders = [] }) => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const locatedCaretakers = useMemo(
    () =>
      caretakers.filter((c) => {
        const coords = c?.user?.address?.coordinates;
        return (
          coords &&
          typeof coords.lat === "number" &&
          typeof coords.lng === "number"
        );
      }),
    [caretakers]
  );

  const locatedElders = useMemo(
    () =>
      elders.filter((e) => {
        const coords = e?.address?.coordinates;
        return (
          coords &&
          typeof coords.lat === "number" &&
          typeof coords.lng === "number"
        );
      }),
    [elders]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Center on first caretaker/elder or center of USA
    const defaultCenter = [39.8283, -98.5795];
    const defaultZoom = 3.5;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      maxZoom: 18,
    }).setView(defaultCenter, defaultZoom);

    // Standard OpenStreetMap tiles
    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 20,
      }
    ).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleMapClick = (e) => {
      const link = e.target.closest('.caretaker-link');
      if (link) {
        e.preventDefault();
        const userId = link.getAttribute('data-userid');
        if (userId) {
          navigate(`/caretakers/${userId}`);
        }
      }
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('click', handleMapClick);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('click', handleMapClick);
      }
    };
  }, [navigate]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (locatedCaretakers.length === 0 && locatedElders.length === 0) return;

    const bounds = [];

    // Render Caretakers
    locatedCaretakers.forEach((c) => {
      const coords = c.user.address.coordinates;
      const name = `${c?.user?.firstName || ""} ${c?.user?.lastName || ""
        }`.trim();

      const customIcon = L.divIcon({
        html: `<div class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg ring-2 ring-white" title="${name}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        </div>`,
        className: "custom-leaflet-marker",
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const marker = L.marker([coords.lat, coords.lng], { icon: customIcon });

      marker.bindPopup(`
        <div style="font-family: ui-sans-serif, system-ui, sans-serif; font-size: 13px; line-height: 1.4; color: #1f2937; padding: 2px;">
          <a href="/caretakers/${c.user?._id || c.user?.id}" data-userid="${c.user?._id || c.user?.id}" class="caretaker-link" style="font-weight: 600; font-size: 14px; margin-bottom: 2px; color: #0f766e; text-decoration: underline; cursor: pointer; display: block;">${name}</a>
          <div style="color: #4b5563; margin-bottom: 4px;">Caretaker</div>
          <div style="color: #4b5563; margin-bottom: 4px;">${c.user.address.city || ""}</div>
          <div style="font-weight: 550; color: #0f766e;">${c.hourlyRate ? `₹${c.hourlyRate}/hr` : ""}</div>
        </div>
      `);

      marker.addTo(map);
      markersRef.current.push(marker);
      bounds.push([coords.lat, coords.lng]);
    });

    // Render Elders
    locatedElders.forEach((e) => {
      const coords = e.address.coordinates;
      const name = `${e?.firstName || ""} ${e?.lastName || ""}`.trim();

      const customIcon = L.divIcon({
        html: `<div class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg ring-2 ring-white animate-bounce" title="Elder: ${name}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
        </div>`,
        className: "custom-leaflet-marker-elder",
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const marker = L.marker([coords.lat, coords.lng], { icon: customIcon });

      marker.bindPopup(`
        <div style="font-family: ui-sans-serif, system-ui, sans-serif; font-size: 13px; line-height: 1.4; color: #1f2937; padding: 2px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 2px; color: #be123c;">Elder: ${name}</div>
          <div style="color: #4b5563; margin-bottom: 4px;">Relation: ${e.relation || "Elder"}</div>
          <div style="color: #4b5563;">${e.address?.street || ""}, ${e.address?.city || ""}</div>
        </div>
      `);

      marker.addTo(map);
      markersRef.current.push(marker);
      bounds.push([coords.lat, coords.lng]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [locatedCaretakers, locatedElders]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm"
      style={{ minHeight: "400px" }}
    />
  );
};

const SearchPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [caretakers, setCaretakers] = useState([]);
  const [elders, setElders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [sortBy, setSortBy] = useState("recommended");
  const [showMap, setShowMap] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    if (!user) {
      setElders([]);
      return;
    }
    let cancelled = false;
    api
      .get("/users/me/elders")
      .then((res) => {
        if (!cancelled) {
          setElders(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch elders for map view: ", err);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Debounce the free-text search field only. Other filters update immediately.
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(searchDebounceRef.current);
  }, [filters.search]);

  useEffect(() => {
    let cancelled = false;

    const fetchCaretakers = async () => {
      setLoading(true);
      setError(null);
      try {
        const qs = buildQueryString(filters);
        const url = qs ? `/caretakers?${qs}` : "/caretakers";
        const res = await api.get(url);
        if (cancelled) return;
        const data = Array.isArray(res.data) ? res.data : [];
        setCaretakers(data);
        setUsingSampleData(false);
      } catch (err) {
        if (cancelled) return;
        // Fall back to sample data so the page is still useful when the
        // backend is unreachable.
        setCaretakers(SAMPLE_CARETAKERS);
        setUsingSampleData(true);
        setError(
          err?.response?.data?.message ||
          "Couldn't reach the server. Showing sample caretakers."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCaretakers();
    return () => {
      cancelled = true;
    };
    // Intentionally excluding `filters.search`: it is debounced client-side.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.serviceType,
    filters.city,
    filters.minRating,
    filters.minRate,
    filters.maxRate,
    filters.language,
    filters.verifiedOnly,
  ]);

  const availableCities = useMemo(() => {
    const set = new Set();
    caretakers.forEach((c) => {
      if (Array.isArray(c.cities)) {
        c.cities.forEach((city) => city && set.add(city));
      } else if (c?.user?.address?.city) {
        set.add(c.user.address.city);
      }
    });
    return Array.from(set).sort();
  }, [caretakers]);

  const filteredCaretakers = useMemo(() => {
    const search = debouncedSearch.trim().toLowerCase();
    if (!search) return caretakers;
    return caretakers.filter((c) => {
      const user = c.user || {};
      const name = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
      const cities = (c.cities || []).join(" ").toLowerCase();
      const services = (c.services || []).join(" ").toLowerCase();
      return (
        name.includes(search) ||
        cities.includes(search) ||
        services.includes(search)
      );
    });
  }, [caretakers, debouncedSearch]);

  const sortedCaretakers = useMemo(() => {
    const list = [...filteredCaretakers];
    switch (sortBy) {
      case "rating":
        return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "price-asc":
        return list.sort(
          (a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0)
        );
      case "experience":
        return list.sort((b, a) => (a.experience || 0) - (b.experience || 0));
      case "recommended":
      default:
        return list.sort((a, b) => {
          const verified = (b.isVerified ? 1 : 0) - (a.isVerified ? 1 : 0);
          if (verified !== 0) return verified;
          return (b.rating || 0) - (a.rating || 0);
        });
    }
  }, [filteredCaretakers, sortBy]);

  const handleClear = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleViewProfile = (caretaker) => {
    const userId = caretaker?.user?._id || caretaker?.user?.id || caretaker?.user;
    if (userId) navigate(`/caretakers/${userId}`);
  };

  const handleBook = (caretaker) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "Customer" && user.role !== "Admin") {
      navigate("/dashboard");
      return;
    }
    const userId = caretaker?.user?._id || caretaker?.user?.id || caretaker?.user;
    if (userId) navigate(`/caretakers/${userId}/book`);
  };

  const showBookCta = !user || user.role === "Customer" || user.role === "Admin";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col gap-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-700">
            <SearchIcon className="h-3.5 w-3.5" />
            Find the right caretaker
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Browse caretakers near you
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Verified, compassionate professionals ready to support your loved ones.
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-6 lg:items-start">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block lg:sticky lg:top-24">
            <Card className="border-gray-200">
              <CardContent className="p-5">
                <FilterContent
                  filters={filters}
                  setFilters={setFilters}
                  cities={availableCities}
                  onClear={handleClear}
                />
              </CardContent>
            </Card>
          </aside>

          {/* Main column */}
          <div className="space-y-4">
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                      type="search"
                      placeholder="Search by name, city, or service..."
                      value={filters.search}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          search: e.target.value,
                        }))
                      }
                      className="pl-10"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="pl-9 pr-8 min-w-[170px]"
                        aria-label="Sort caretakers"
                      >
                        {SORT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            Sort: {opt.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <Button
                      variant={showMap ? "default" : "outline"}
                      size="default"
                      onClick={() => setShowMap((s) => !s)}
                      aria-pressed={showMap}
                    >
                      <MapIcon className="h-4 w-4" />
                      {showMap ? "Hide Map" : "Toggle Map"}
                    </Button>
                    <Button
                      variant="outline"
                      className="lg:hidden"
                      onClick={() => setShowMobileFilters(true)}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                  <span>
                    {loading
                      ? "Searching…"
                      : `${sortedCaretakers.length} ${sortedCaretakers.length === 1
                        ? "caretaker"
                        : "caretakers"
                      } found`}
                  </span>
                  {usingSampleData && (
                    <Badge variant="warning">Sample data</Badge>
                  )}
                </div>
                {error && (
                  <p
                    role="alert"
                    className="mt-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
                  >
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </p>
                )}
              </CardContent>
            </Card>

            {showMap && (
              <div className="h-[420px] w-full">
                <MapPanel caretakers={sortedCaretakers} elders={elders} />
              </div>
            )}

            {loading ? (
              <div className="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : sortedCaretakers.length === 0 ? (
              <EmptyState onClear={handleClear} />
            ) : (
              <div className="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {sortedCaretakers.map((c) => (
                  <CaretakerCard
                    key={c._id || `${c.user?.firstName}-${c.user?.lastName}`}
                    caretaker={c}
                    onViewProfile={handleViewProfile}
                    onBook={showBookCta ? handleBook : undefined}
                  />
                ))}
              </div>
            )}

            <div className="pt-2 text-center">
              <Button variant="ghost" asChild={false} onClick={() => navigate("/")}>
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
        <SheetContent side="left" className="overflow-y-auto">
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Narrow down caretakers by your preferences.
          </SheetDescription>
          <FilterContent
            filters={filters}
            setFilters={setFilters}
            cities={availableCities}
            onClear={handleClear}
            onApply={() => setShowMobileFilters(false)}
            variant="sheet"
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default SearchPage;
