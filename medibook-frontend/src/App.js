import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

const DoctorListing = lazy(() => import('./pages/DoctorListing'));
const DoctorProfile = lazy(() => import('./pages/DoctorProfile'));
const About = lazy(() => import('./pages/About'));
const PatientDashboard = lazy(() => import('./pages/PatientDashboard'));
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const BookingConfirmation = lazy(() => import('./pages/BookingConfirmation'));
const SignUp = lazy(() => import('./pages/Auth').then(module => ({ default: module.SignUp })));
const Login = lazy(() => import('./pages/Auth').then(module => ({ default: module.Login })));

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen bg-bg" />}>
        <Routes>
          <Route path="/"                     element={<Home />} />
          <Route path="/about"                element={<About />} />
          <Route path="/doctors"              element={<DoctorListing />} />
          <Route path="/doctors/:id"          element={<DoctorProfile />} />
          <Route path="/signup"               element={<SignUp />} />
          <Route path="/login"                element={<Login />} />
          <Route path="/patient-dashboard"    element={<PatientDashboard />} />
          <Route path="/doctor-dashboard"     element={<DoctorDashboard />} />
          <Route path="/admin-dashboard"      element={<AdminDashboard />} />
          <Route path="/booking-confirmation/:id" element={<BookingConfirmation />} />
          <Route path="/booking-confirmation" element={<BookingConfirmation />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
