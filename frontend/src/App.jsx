import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import LoginForm from './components/auth/loginForm';
import SignupForm from './components/auth/SignupForm';
import StudentDashboard from './components/dashboard/StudentDashboard';
import 'bootstrap/dist/css/bootstrap.min.css';
import ErrorBoundary from './components/ErrorBoundary';
import Footer from './components/layout/footer';
import SupportDashboard from './components/dashboard/SupportDashboard';
import WardenDashboard from './components/dashboard/WardenDashboard';
import LostFoundGrid from './pages/lostAndFound';
import OAuthSuccess from './pages/OAuthSuccess';

function App() {
  return (
    <ErrorBoundary>
    <Router>
      <div className="min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login/student" element={<LoginForm userType="student" />} />
          <Route path="/login/warden" element={<LoginForm userType="warden" />} />
          <Route path="/login/support" element={<LoginForm userType="support" />} />
          
          <Route path="/signup/student" element={<SignupForm userType="student" />} />
          <Route path="/signup/warden" element={<SignupForm userType="warden" />} />
          <Route path="/signup/support" element={<SignupForm userType="support" />} />
          
          <Route path="/dashboard/student" element={<StudentDashboard />} />
          <Route path="/dashboard/warden" element={<WardenDashboard />} />
          <Route path="/dashboard/support" element={<SupportDashboard />} />
          <Route path="/lost-found" element={<LostFoundGrid />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
        </Routes>
      </div>
      <Footer />

    </Router>
  </ErrorBoundary>
  );
}

export default App;