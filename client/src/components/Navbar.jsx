import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Heart, Menu, User, LogOut, LayoutDashboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/useAuth";
import Logo from "@/components/Logo";
import { useChat } from "@/contexts/ChatContext";
import api from "@/services/api";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { openChatWith, isWidgetOpen } = useChat();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleSupportClick = async () => {
    try {
      const res = await api.get('/users/support-admin');
      openChatWith(res.data);
      setMobileOpen(false); // Close mobile menu if open
    } catch (err) {
      console.error("Failed to connect to support", err);
      alert("Support is currently unavailable.");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setMobileOpen(false);
    navigate("/");
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors hover:text-teal-700 ${
      isActive ? "text-teal-700" : "text-gray-700"
    }`;

  const renderInitials = () => {
    if (!user) return "";
    const first = user.firstName?.[0] || user.name?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <Logo className="h-9 w-9" />
            <span className="text-xl font-bold text-gray-900">NestLife</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {!user ? (
              <>
                <NavLink to="/" end className={navLinkClass}>
                  Home
                </NavLink>
                <a href="/#find" className="text-sm font-medium text-gray-700 hover:text-teal-700 transition-colors">
                  Find Caretaker
                </a>
                <a href="/#how-it-works" className="text-sm font-medium text-gray-700 hover:text-teal-700 transition-colors">
                  How It Works
                </a>
                <NavLink to="/contact" className={navLinkClass}>
                  Contact Us
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
                {user.role === "Customer" && (
                  <>
                    <NavLink to="/search" className={navLinkClass}>Find Caretaker</NavLink>
                    <NavLink to="/my-bookings" className={navLinkClass}>My Bookings</NavLink>
                    <button onClick={handleSupportClick} className="text-sm font-medium text-gray-700 hover:text-teal-700 transition-colors">Support</button>
                  </>
                )}
                {user.role === "Caretaker" && (
                  <>
                    <NavLink to="/my-bookings" className={navLinkClass}>My Bookings</NavLink>
                    <NavLink to="/caretaker/profile/edit" className={navLinkClass}>My Profile</NavLink>
                    <button onClick={handleSupportClick} className="text-sm font-medium text-gray-700 hover:text-teal-700 transition-colors">Support</button>
                  </>
                )}
                {user.role === "Admin" && (
                  <NavLink to="/admin/dashboard" className={navLinkClass}>Admin Dashboard</NavLink>
                )}
              </>
            )}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="rounded-full hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  aria-label="Open user menu"
                  aria-expanded={menuOpen}
                >
                  <Avatar className="h-10 w-10 border border-gray-200 bg-white">
                    {user.avatar ? (
                      <img src={user.avatar} alt="User avatar" className="h-full w-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                        {renderInitials()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      My Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button variant="ghost" asChild={false} onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button onClick={() => navigate("/register")}>Sign Up</Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden h-screen w-screen">
          <div
            className="fixed inset-0 backdrop-blur-sm"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute right-0 top-0 h-full w-3/4 max-w-sm shadow-xl p-6 flex flex-col gap-4 z-[60]"
            style={{ backgroundColor: "#ffffff" }}
          >
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <Link to={user ? "/dashboard" : "/"} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 mt-8 hover:opacity-80 transition-opacity">
              <Logo className="h-9 w-9" />
              <span className="text-xl font-bold text-gray-900">NestLife</span>
            </Link>
            <nav className="flex flex-col gap-2 mt-4">
              {user && (
                <div className="mb-2 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                  <Avatar className="h-10 w-10 border border-gray-200 bg-white">
                    {user.avatar ? (
                      <img src={user.avatar} alt="User avatar" className="h-full w-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                        {renderInitials()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.name || "User"}
                    </p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              )}
              {!user ? (
                <>
                  <Link
                    to="/"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Home
                  </Link>
                  <a
                    href="/#find"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Find Caretaker
                  </a>
                  <a
                    href="/#how-it-works"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                  >
                    How It Works
                  </a>
                  <Link
                    to="/contact"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Contact Us
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Dashboard
                  </Link>
                  {user.role === "Customer" && (
                    <>
                      <Link to="/search" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100">Find Caretaker</Link>
                      <Link to="/my-bookings" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100">My Bookings</Link>
                      <button onClick={handleSupportClick} className="text-left rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100">Support</button>
                    </>
                  )}
                  {user.role === "Caretaker" && (
                    <>
                      <Link to="/my-bookings" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100">My Bookings</Link>
                      <Link to="/caretaker/profile/edit" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100">My Profile</Link>
                      <button onClick={handleSupportClick} className="text-left rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100">Support</button>
                    </>
                  )}
                  {user.role === "Admin" && (
                    <Link to="/admin/dashboard" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100">Admin Dashboard</Link>
                  )}
                </>
              )}
            </nav>
            <div className="mt-auto flex flex-col gap-2">
              {user ? (
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => { setMobileOpen(false); navigate("/login"); }}>
                    <User className="h-4 w-4" />
                    Login
                  </Button>
                  <Button onClick={() => { setMobileOpen(false); navigate("/register"); }}>
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
