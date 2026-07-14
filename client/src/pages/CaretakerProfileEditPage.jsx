import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Coins,
  FileText,
  GraduationCap,
  Languages,
  Loader2,
  MapPin,
  Phone,
  Save,
  User,
} from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/contexts/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AvatarUploader from "@/components/AvatarUploader";
import Navbar from "@/components/Navbar";
import MapPicker from "@/components/MapPicker";

const AVAILABLE_SERVICES = [
  "Health Check-up",
  "Companionship",
  "Medication Management",
  "Meal Preparation",
  "Mobility Assistance",
  "Errands",
];

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const CaretakerProfileEditPage = () => {
  const navigate = useNavigate();
  const { user, updateUser, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form states
  const [basicInfo, setBasicInfo] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    lat: null,
    lng: null
  });

  const [profileInfo, setProfileInfo] = useState({
    bio: "",
    hourlyRate: 0,
    experience: 0,
    services: [],
    cities: "",
    languages: "",
    certifications: "",
  });

  const [availability, setAvailability] = useState({
    monday: { available: false, start: "09:00", end: "17:00" },
    tuesday: { available: false, start: "09:00", end: "17:00" },
    wednesday: { available: false, start: "09:00", end: "17:00" },
    thursday: { available: false, start: "09:00", end: "17:00" },
    friday: { available: false, start: "09:00", end: "17:00" },
    saturday: { available: false, start: "09:00", end: "17:00" },
    sunday: { available: false, start: "09:00", end: "17:00" },
  });

  const [customService, setCustomService] = useState("");

  const handleAddCustomService = () => {
    const trimmed = customService.trim();
    if (trimmed && !profileInfo.services.includes(trimmed)) {
      setProfileInfo((prev) => ({
        ...prev,
        services: [...prev.services, trimmed],
      }));
    }
    setCustomService("");
  };

  // Redirect if not Caretaker (or Admin)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "Caretaker" && user.role !== "Admin") {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  // Load current user and profile data
  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      try {
        const [userRes, profileRes] = await Promise.all([
          api.get("/users/me"),
          api.get(`/caretakers/${user._id || user.id}/profile`).catch(() => ({ data: null })),
        ]);

        const u = userRes.data;
        const p = profileRes.data;

        setBasicInfo({
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          phone: u.phone || "",
          street: u.address?.street || "",
          city: u.address?.city || "",
          state: u.address?.state || "",
          zipCode: u.address?.zipCode || "",
          lat: u.address?.coordinates?.lat || null,
          lng: u.address?.coordinates?.lng || null
        });

        if (p) {
          setProfileInfo({
            bio: p.bio || "",
            hourlyRate: p.hourlyRate || 0,
            experience: p.experience || 0,
            services: Array.isArray(p.services) ? p.services : [],
            cities: Array.isArray(p.cities) ? p.cities.join(", ") : "",
            languages: Array.isArray(p.languages) ? p.languages.join(", ") : "",
            certifications: Array.isArray(p.certifications) ? p.certifications.join(", ") : "",
          });

          if (p.availability) {
            const updatedAvail = { ...availability };
            DAYS_OF_WEEK.forEach(({ key }) => {
              if (p.availability[key]) {
                updatedAvail[key] = {
                  available: Boolean(p.availability[key].available),
                  start: p.availability[key].start || "09:00",
                  end: p.availability[key].end || "17:00",
                };
              }
            });
            setAvailability(updatedAvail);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load caretaker profile.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadProfileData();
    }
  }, [user]);

  const handleBasicChange = (field, value) => {
    setBasicInfo((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccessMsg(null);
  };

  const handleProfileChange = (field, value) => {
    setProfileInfo((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccessMsg(null);
  };

  const handleServiceToggle = (service) => {
    setProfileInfo((prev) => {
      const services = prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service];
      return { ...prev, services };
    });
  };

  const handleAvailToggle = (day) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], available: !prev[day].available },
    }));
  };

  const handleAvailTimeChange = (day, field, value) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!basicInfo.firstName.trim() || !basicInfo.lastName.trim()) {
      setError("First Name and Last Name are required.");
      return;
    }
    if (!basicInfo.street.trim() || !basicInfo.city.trim() || !basicInfo.state.trim() || !basicInfo.zipCode.trim()) {
      setError("Street, City, State, and ZIP Code are required.");
      return;
    }
    if (basicInfo.lat === null || basicInfo.lng === null) {
      setError("Please choose your caretaker location on the map.");
      return;
    }
    if (Number(profileInfo.hourlyRate) <= 0) {
      setError("Please specify a valid hourly rate greater than 0.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Update basic user details
      const userPayload = {
        firstName: basicInfo.firstName.trim(),
        lastName: basicInfo.lastName.trim(),
        phone: basicInfo.phone.trim(),
        address: {
          street: basicInfo.street.trim(),
          city: basicInfo.city.trim(),
          state: basicInfo.state.trim(),
          zipCode: basicInfo.zipCode.trim(),
          coordinates: {
            lat: basicInfo.lat ? Number(basicInfo.lat) : null,
            lng: basicInfo.lng ? Number(basicInfo.lng) : null
          }
        }
      };
      const userRes = await api.put("/users/me", userPayload);
      updateUser(userRes.data);

      // 2. Update caretaker profile details
      const formattedAvailability = {};
      DAYS_OF_WEEK.forEach(({ key }) => {
        formattedAvailability[key] = {
          available: availability[key].available,
          start: availability[key].start,
          end: availability[key].end,
        };
      });

      const profilePayload = {
        bio: profileInfo.bio.trim(),
        hourlyRate: Number(profileInfo.hourlyRate),
        experience: Number(profileInfo.experience) || 0,
        services: profileInfo.services,
        cities: profileInfo.cities
          ? profileInfo.cities.split(",").map((c) => c.trim()).filter(Boolean)
          : [],
        languages: profileInfo.languages
          ? profileInfo.languages.split(",").map((l) => l.trim()).filter(Boolean)
          : [],
        certifications: profileInfo.certifications
          ? profileInfo.certifications.split(",").map((c) => c.trim()).filter(Boolean)
          : [],
        availability: formattedAvailability,
      };

      await api.put("/caretakers/profile", profilePayload);

      setSuccessMsg("Caretaker profile updated successfully!");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || (loading && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Edit Caretaker Profile
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your public listing, availability, rates, and services.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {successMsg && (
            <div
              role="alert"
              className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
            >
              {successMsg}
            </div>
          )}

          <AvatarUploader
            user={user}
            onUserUpdated={updateUser}
            onError={setError}
            onSuccess={setSuccessMsg}
          />

          {/* 1. Basic Info */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-teal-600" />
                Basic Information
              </CardTitle>
              <CardDescription>Your main account contact details.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={basicInfo.firstName}
                  onChange={(e) => handleBasicChange("firstName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={basicInfo.lastName}
                  onChange={(e) => handleBasicChange("lastName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={basicInfo.phone}
                    onChange={(e) => handleBasicChange("phone", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-lg border border-gray-150 bg-gray-50 p-4 sm:col-span-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <MapPin className="h-4 w-4 text-teal-600" />
                  Primary Caretaker Address & Map Location
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    type="text"
                    placeholder="123 Care Lane"
                    value={basicInfo.street}
                    onChange={(e) => handleBasicChange("street", e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="San Francisco"
                      value={basicInfo.city}
                      onChange={(e) => handleBasicChange("city", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      type="text"
                      placeholder="CA"
                      value={basicInfo.state}
                      onChange={(e) => handleBasicChange("state", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP</Label>
                    <Input
                      id="zipCode"
                      type="text"
                      placeholder="94110"
                      value={basicInfo.zipCode}
                      onChange={(e) => handleBasicChange("zipCode", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Choose Location on Map</Label>
                  <MapPicker
                    lat={basicInfo.lat}
                    lng={basicInfo.lng}
                    onChange={(lat, lng) => {
                      handleBasicChange("lat", lat);
                      handleBasicChange("lng", lng);
                    }}
                  />
                  <p className="text-[10px] text-gray-500">
                    Click on the map or click the locate button to update your coordinates.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Professional Profile */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                Professional Listing Details
              </CardTitle>
              <CardDescription>
                This information will be displayed publicly on your caregiver card and profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio">About Me (Bio)</Label>
                <textarea
                  id="bio"
                  rows={4}
                  placeholder="Introduce yourself to families. Describe your experience, passion, and care philosophy..."
                  value={profileInfo.bio}
                  onChange={(e) => handleProfileChange("bio", e.target.value)}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                      id="hourlyRate"
                      type="number"
                      min="0"
                      value={profileInfo.hourlyRate}
                      onChange={(e) => handleProfileChange("hourlyRate", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    value={profileInfo.experience}
                    onChange={(e) => handleProfileChange("experience", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Services Offered</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {AVAILABLE_SERVICES.map((s) => (
                    <label key={s} className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileInfo.services.includes(s)}
                        onChange={() => handleServiceToggle(s)}
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      {s}
                    </label>
                  ))}
                  {profileInfo.services.filter(s => !AVAILABLE_SERVICES.includes(s)).map((s) => (
                    <label key={s} className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => handleServiceToggle(s)}
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      {s} (Custom)
                    </label>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    placeholder="Add custom service (e.g., Pet Care)"
                    value={customService}
                    onChange={(e) => setCustomService(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomService();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddCustomService} variant="secondary">Add</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cities">Service Cities (comma-separated)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="cities"
                    type="text"
                    placeholder="New York, Brooklyn, Queens"
                    value={profileInfo.cities}
                    onChange={(e) => handleProfileChange("cities", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="languages">Languages Spoken (comma-separated)</Label>
                <div className="relative">
                  <Languages className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="languages"
                    type="text"
                    placeholder="English, Spanish, French"
                    value={profileInfo.languages}
                    onChange={(e) => handleProfileChange("languages", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certifications">Certifications & Credentials (comma-separated)</Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="certifications"
                    type="text"
                    placeholder="Registered Nurse (RN), CPR Certified, First Aid"
                    value={profileInfo.certifications}
                    onChange={(e) => handleProfileChange("certifications", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Availability Schedule */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-teal-600" />
                Weekly Availability
              </CardTitle>
              <CardDescription>
                Indicate when you are available to receive booking requests during the week.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 divide-y divide-gray-150">
              {DAYS_OF_WEEK.map(({ key, label }) => {
                const dayAvail = availability[key];
                return (
                  <div key={key} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between first:pt-0">
                    <label className="flex items-center gap-3 font-semibold text-gray-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dayAvail.available}
                        onChange={() => handleAvailToggle(key)}
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="w-24 text-sm">{label}</span>
                    </label>

                    {dayAvail.available ? (
                      <div className="flex items-center gap-2 text-sm pl-7 sm:pl-0">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <Input
                          type="time"
                          value={dayAvail.start}
                          onChange={(e) => handleAvailTimeChange(key, "start", e.target.value)}
                          className="w-28 h-9 text-xs"
                        />
                        <span className="text-gray-400">to</span>
                        <Input
                          type="time"
                          value={dayAvail.end}
                          onChange={(e) => handleAvailTimeChange(key, "end", e.target.value)}
                          className="w-28 h-9 text-xs"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic pl-7 sm:pl-0">Unavailable</span>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard")}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700 font-semibold" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Listing
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CaretakerProfileEditPage;
