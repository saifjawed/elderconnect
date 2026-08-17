import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";
import ChatWidget from "./components/ChatWidget";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SearchPage from "./pages/SearchPage";
import CaretakerProfilePage from "./pages/CaretakerProfilePage";
import BookingFormPage from "./pages/BookingFormPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import DashboardPage from "./pages/DashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import RazorpayPaymentPage from "./pages/RazorpayPaymentPage";
import CustomerProfileEditPage from "./pages/CustomerProfileEditPage";
import CaretakerProfileEditPage from "./pages/CaretakerProfileEditPage";
import ContactPage from "./pages/ContactPage";

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/caretakers/:caretakerUserId" element={<CaretakerProfilePage />} />
            <Route path="/caretakers/:caretakerUserId/book" element={<BookingFormPage />} />
            <Route path="/my-bookings" element={<MyBookingsPage />} />
            <Route path="/bookings" element={<MyBookingsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/payment/:id" element={<RazorpayPaymentPage />} />
            <Route path="/profile/edit" element={<CustomerProfileEditPage />} />
            <Route path="/caretaker/profile/edit" element={<CaretakerProfileEditPage />} />
          </Routes>
          <ChatWidget />
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;

