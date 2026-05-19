import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import DoctorListing from './pages/DoctorListing';
import DoctorProfile from './pages/DoctorProfile';
import { SignUp, Login } from './pages/Auth';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import BookingConfirmation from './pages/BookingConfirmation';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"                     element={<Home />} />
        <Route path="/doctors"              element={<DoctorListing />} />
        <Route path="/doctors/:id"          element={<DoctorProfile />} />
        <Route path="/signup"               element={<SignUp />} />
        <Route path="/login"                element={<Login />} />
        {/* <Route path="/about"                element={<About />} />
        <Route path="/contact"              element={<Contact />} /> */}
        <Route path="/patient-dashboard"    element={<PatientDashboard />} />
        <Route path="/doctor-dashboard"     element={<DoctorDashboard />} />
        <Route path="/admin-dashboard"      element={<AdminDashboard />} />
        <Route path="/booking-confirmation/:id" element={<BookingConfirmation />} />
        <Route path="/booking-confirmation" element={<BookingConfirmation />} />
      </Routes>
    </Router>
  );
}

export default App;
