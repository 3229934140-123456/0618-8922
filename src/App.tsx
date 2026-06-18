import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Home from '@/pages/Home';
import Services from '@/pages/Services';
import Booking from '@/pages/Booking';
import MyBookings from '@/pages/MyBookings';
import Album from '@/pages/Album';
import Profile from '@/pages/Profile';
import Review from '@/pages/Review';
import Admin from '@/pages/Admin';
import AdminSchedule from '@/pages/AdminSchedule';
import AdminPricing from '@/pages/AdminPricing';

function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}

function AdminLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/album/:accessKey" element={<Album />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/review/:bookingId" element={<Review />} />
        </Route>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/schedule" element={<AdminSchedule />} />
          <Route path="/admin/pricing" element={<AdminPricing />} />
        </Route>
      </Routes>
    </Router>
  );
}
