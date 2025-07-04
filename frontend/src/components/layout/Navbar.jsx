import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  const loginRef = useRef(null);
  const signupRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (loginRef.current && !loginRef.current.contains(event.target)) {
        setIsLoginOpen(false);
      }
      if (signupRef.current && !signupRef.current.contains(event.target)) {
        setIsSignupOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-[#432818] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="group text-3xl font-extrabold no-underline">
            <span className="text-white hover:text-gray-200 transition-colors duration-300">
              SNU Hive
            </span>
          </Link>
          <div className="flex space-x-4">
            <Link
                      to="/lost-found"
                      className="px-3 py-2 text-white hover:bg-[#432818] rounded-md"
                    >
                      Lost & Found
            </Link>
            <div className="relative" ref={loginRef}>
              <button
                onClick={() => setIsLoginOpen(!isLoginOpen)}
                className="px-3 py-2 hover:bg-[#432818] rounded-md"
              >
                Login
              </button>
              {isLoginOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <Link
                    to="/login/student"
                    className="block px-4 py-2 bg-white text-[#432818] hover:bg-[#432818] hover:text-white transition"
                    onClick={() => setIsLoginOpen(false)}
                  >
                    Student Login
                  </Link>
                  <Link
                    to="/login/warden"
                    className="block px-4 py-2 bg-white text-[#432818] hover:bg-[#432818] hover:text-white transition"
                    onClick={() => setIsLoginOpen(false)}
                  >
                    Warden Login
                  </Link>
                  <Link
                    to="/login/support"
                    className="block px-4 py-2 bg-white text-[#432818] hover:bg-[#432818] hover:text-white transition"
                    onClick={() => setIsLoginOpen(false)}
                  >
                    Support Admin Login
                  </Link>
                </div>
              )}
            </div>

            <div className="relative" ref={signupRef}>
              <button
                onClick={() => setIsSignupOpen(!isSignupOpen)}
                className="px-3 py-2 hover:bg-[#432818] rounded-md"
              >
                Sign Up
              </button>
              {isSignupOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <Link
                    to="/signup/student"
                    className="block px-4 py-2 bg-white text-[#432818] hover:bg-[#432818] hover:text-white transition"
                    onClick={() => setIsSignupOpen(false)}
                  >
                    Student Sign Up
                  </Link>
                  <Link
                    to="/signup/warden"
                    className="block px-4 py-2 bg-white text-[#432818] hover:bg-[#432818] hover:text-white transition"
                    onClick={() => setIsSignupOpen(false)}
                  >
                    Warden Sign Up
                  </Link>
                  <Link
                    to="/signup/support"
                    className="block px-4 py-2 bg-white text-[#432818] hover:bg-[#432818] hover:text-white transition"
                    onClick={() => setIsSignupOpen(false)}
                  >
                    Support Admin Sign Up
                  </Link>
            
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
