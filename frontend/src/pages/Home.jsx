import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeCarousel from '../components/layout/HomeCarousel';

const Home = () => {
  const navigate = useNavigate();
  const isRecentLogin = useCallback((role) => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('userType');
    const lastLogin = Number(localStorage.getItem('lastLogin') || 0);
    const MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes
    return !!token && storedRole === role && Date.now() - lastLogin <= MAX_AGE_MS;
  }, []);

  const goToSection = useCallback((role, section) => {
    if (isRecentLogin(role)) {
      const sectionQuery = section ? `?section=${section}` : '';
      navigate(`/dashboard/${role}${sectionQuery}`);
    } else {
      navigate(`/login/${role}`);
    }
  }, [isRecentLogin, navigate]);

  return (
    <div className="min-h-screen bg-[#f9eae1]">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <HomeCarousel />

        <div className="mt-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="bg-[#432818] p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <h2 className="text-xl font-semibold text-white mb-4">For Students</h2>
              <p className="text-white">Manage your hostel experience, file complaints, and track requests</p>
              <div className="mt-4 grid gap-3">
                <button
                  className="w-full bg-white text-[#432818] font-semibold py-2 px-3 rounded hover:bg-gray-100 transition"
                  onClick={() => goToSection('student', 'complaints')}
                >
                  Go to Complaints
                </button>
                <button
                  className="w-full bg-white text-[#432818] font-semibold py-2 px-3 rounded hover:bg-gray-100 transition"
                  onClick={() => goToSection('student', 'food')}
                >
                  Go to Food Requests
                </button>
              </div>
            </div>
            <div className="bg-[#432818] p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <h2 className="text-xl font-semibold text-white mb-4">For Wardens</h2>
              <p className="text-white">Oversee hostel operations and manage student requests</p>
              <div className="mt-4 grid gap-3">
                <button
                  className="w-full bg-white text-[#432818] font-semibold py-2 px-3 rounded hover:bg-gray-100 transition"
                  onClick={() => goToSection('warden')}
                >
                  View Food Requests
                </button>
              </div>
            </div>
            <div className="bg-[#432818] p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <h2 className="text-xl font-semibold text-white mb-4">For Support Staff</h2>
              <p className="text-white">Handle maintenance requests and keep the facility running smoothly</p>
              <div className="mt-4 grid gap-3">
                <button
                  className="w-full bg-white text-[#432818] font-semibold py-2 px-3 rounded hover:bg-gray-100 transition"
                  onClick={() => goToSection('support')}
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;