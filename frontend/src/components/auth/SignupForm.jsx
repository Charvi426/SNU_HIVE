import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentFields from './StudentFields';
import SupportFields from './SupportFields';
import WardenFields from './WardenFields';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const loginEndpoints = {
  student: '/loginStudent',
  warden: '/loginWarden',
  support: '/loginSupport'
};

const SignupForm = ({ userType }) => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormData = {
    email: '',
    password: '',
    ...(userType === 'student' && {
      roll_no: '',
      s_name: '',
      dept: '',
      batch: '',
      contact_no: '',
      room_no: '',
      hostel_id: '',
      parent_contact: '',
      snu_email_id: ''
    }),
    ...(userType === 'warden' && {
      warden_id: '',
      w_name: '',
      contact_no: ''
    }),
    ...(userType === 'support' && {
      D_Name: '',
      staff_capacity: '',
      warden_id: ''
    })
  };

  const [formData, setFormData] = useState(initialFormData);

  const validateForm = () => {
    if (!formData.password || formData.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    switch (userType) {
      case 'student':
        if (!formData.roll_no || !formData.s_name || !formData.snu_email_id ||
            !formData.dept || !formData.batch || !formData.contact_no ||
            !formData.room_no || !formData.hostel_id || !formData.parent_contact) {
          throw new Error('All student fields are required');
        }
        if (!/^\d{10}$/.test(formData.contact_no)) {
          throw new Error('Contact number must be 10 digits');
        }
        if (!/^\d{10}$/.test(formData.parent_contact)) {
          throw new Error('Parent contact must be 10 digits');
        }
        if (!/^[a-zA-Z0-9._%+-]+@snu\.edu\.in$/.test(formData.snu_email_id)) {
          throw new Error('Please enter a valid SNU email address');
        }
        break;

        case 'warden':
  if (!formData.warden_id || !formData.w_name || !formData.email || !formData.contact_no) {
    throw new Error('All warden fields are required');
  }
  if (!/^\d{10}$/.test(formData.contact_no)) {
    throw new Error('Contact number must be 10 digits');
  }
  // Update warden ID validation to accept two digits
  if (!/^\d{2}$/.test(formData.warden_id)) {
    throw new Error('Warden ID must be a two-digit number (e.g., 01)');
  }
  if (!/^[a-zA-Z\s]+$/.test(formData.w_name)) {
    throw new Error('Warden name should only contain letters and spaces');
  }
  break;

      case 'support':
        if (!formData.D_Name || !formData.email || !formData.staff_capacity) {
          throw new Error('Department name, email and staff capacity are required');
        }
        if (isNaN(parseInt(formData.staff_capacity)) || parseInt(formData.staff_capacity) < 1) {
          throw new Error('Staff capacity must be a positive number');
        }
        break;

      default:
        throw new Error(`Invalid user type: ${userType}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      validateForm();

      const endpoints = {
        student: '/createStudent',
        warden: '/createWarden',
        support: '/createSupportAdmin'
      };

      const endpoint = endpoints[userType];
      if (!endpoint) {
        throw new Error(`Invalid user type: ${userType}`);
      }

      let requestData = {};
      switch (userType) {
        case 'student':
          requestData = {
            roll_no: formData.roll_no.trim(),
            s_name: formData.s_name.trim(),
            dept: formData.dept,
            batch: parseInt(formData.batch),
            contact_no: formData.contact_no,
            snu_email_id: formData.snu_email_id.trim().toLowerCase(),
            password: formData.password,
            room_no: formData.room_no.toUpperCase(),
            hostel_id: formData.hostel_id,
            parent_contact: formData.parent_contact
          };
          break;

        case 'warden':
  requestData = {
    warden_id: formData.warden_id.padStart(2, '0'), 
    w_name: formData.w_name.trim(),
    email: formData.email.trim().toLowerCase(),
    password: formData.password,
    contact_no: formData.contact_no.toString()
  };
  break;

        case 'support':
          requestData = {
            D_Name: formData.D_Name.trim(),
            warden_id: formData.warden_id?.trim() || null,
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            staff_capacity: parseInt(formData.staff_capacity)
          };
          break;
      }

      console.log('Sending request:', {
        endpoint,
        data: { ...requestData, password: '[HIDDEN]' }
      });

      try {
          console.log('Attempting to create warden account:', {
            ...requestData,
            password: '[HIDDEN]'
          });
      } catch (error) {
          console.error('Error in try block:', error);
      }

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const loginData = {
          ...(userType === 'student' ? { 
            snu_email_id: formData.snu_email_id 
          } : { 
            email: formData.email 
          }),
          password: formData.password
        };

        const loginResponse = await axios.post(
          `${API_BASE_URL}${loginEndpoints[userType]}`, 
          loginData,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (loginResponse.data.success) {
          localStorage.setItem('token', loginResponse.data.token);
          localStorage.setItem('userType', userType);
          localStorage.setItem('userData', JSON.stringify(loginResponse.data.userData));
          
          navigate(`/${userType}/dashboard`);
        } else {
          navigate(`/login/${userType}`);
        }
      } else {
        throw new Error(response.data.message || 'Failed to create account');
      }

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage);
      console.error('Signup error:', {
        message: errorMessage,
        data: error.response?.data,
        status: error.response?.status,
        requestData: { ...formData, password: '[HIDDEN]' }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFields = () => {
    switch (userType) {
      case 'student':
        return <StudentFields formData={formData} setFormData={setFormData} />;
      case 'warden':
        return <WardenFields formData={formData} setFormData={setFormData} />;
      case 'support':
        return <SupportFields formData={formData} setFormData={setFormData} />;
      default:
        return null;
    }
  };

return (
  <div className="min-h-screen bg-gray-50  p-8 sm:p-12 lg:p-16">
    <div className="flex min-h-[80vh] max-w-6xl mx-auto rounded-xl overflow-hidden shadow-2xl">
      {}
      <div className="hidden md:flex md:w-1/2 bg-[#432818]">
        <img
          src="/images/chessgarden.jpg" 
          alt="SNUHive Welcome"
          className="w-full h-full object-cover"
        />
      </div>

      {}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-8 py-12 bg-white">
        <div className="max-w-md w-full mx-auto">
          {}
          <h2 className="text-3xl font-bold text-[#432818] text-center mb-8">
            Create {userType} Account
          </h2>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r" role="alert">
              <div className="flex">
                <div className="flex-shrink-0">
                  {}
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <button 
                  className="ml-auto -mx-1.5 -my-1.5"
                  onClick={() => setError('')}
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#432818] focus:border-[#432818] sm:text-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {renderFields()}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#432818] focus:border-[#432818] sm:text-sm"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                  ${isSubmitting 
                    ? 'bg-[#8B7355] cursor-not-allowed' 
                    : 'bg-[#432818] hover:bg-[#5C3A2E] transition-colors duration-200'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#432818]`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : 'Sign up'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
);
};

export default SignupForm;