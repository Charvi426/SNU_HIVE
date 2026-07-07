import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const WardenDashboard = () => {
  const navigate = useNavigate();
  const [foodRequests, setFoodRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updateInProgress, setUpdateInProgress] = useState(false);

  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvError, setCsvError] = useState('');
  const [csvResult, setCsvResult] = useState(null);

  const statusColors = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Approved': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800'
  };

  const statusMapping = {
    'PENDING': 'Pending',
    'APPROVED': 'Approved',
    'REJECTED': 'Rejected'
  };
const API_URL = import.meta.env.VITE_API_URL;
  const fetchFoodRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/foodrequests`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        const sortedRequests = response.data.sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        );
        setFoodRequests(sortedRequests);
      }
    } catch (err) {
      console.error('Error fetching food requests:', err);
      if (err.response?.status === 403) {
        navigate('/login/warden');
      }
      setError(err.response?.data?.message || 'Failed to fetch food requests');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (foodId, newStatus) => {
    setUpdateInProgress(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Sending status update:', { foodId, newStatus });

      const response = await axios.patch(
        `${API_URL}/api/foodrequest/${foodId}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.message === "Food request status updated successfully") {
        setFoodRequests(prevRequests => 
          prevRequests.map(request => 
            request.food_id === foodId 
              ? { ...request, status: newStatus }
              : request
          )
        );
        setError('');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdateInProgress(false);
      await fetchFoodRequests();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');

    if (!token || userType !== 'warden') {
      navigate('/login/warden');
      return;
    }

    fetchFoodRequests();
  }, [navigate]);

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      setCsvError('Please choose a CSV file first');
      return;
    }

    setCsvUploading(true);
    setCsvError('');
    setCsvResult(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('csvFile', csvFile);

      const response = await axios.post(`${API_URL}/api/warden/students/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setCsvResult(response.data);
      setCsvFile(null);
      e.target.reset();
    } catch (err) {
      console.error('Error uploading student CSV:', err);
      setCsvError(err.response?.data?.message || 'Failed to upload CSV');
    } finally {
      setCsvUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Food Requests</h1>
          <button
            onClick={fetchFoodRequests}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            disabled={updateInProgress}
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Upload Student Records</h2>
          <p className="text-sm text-gray-500 mb-4">
            Upload a CSV with columns: roll_no, s_name, snu_email_id, dept, batch, contact_no, parent_contact, room_no, hostel_id.
            Existing students (matched by roll_no) are updated in place; new rows create new records. Students then set their own password by signing up with their snu_email_id.
          </p>

          <form onSubmit={handleCsvUpload} className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files[0] || null)}
              className="block text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-[#432818] file:text-white hover:file:bg-[#5C3A2E]"
            />
            <button
              type="submit"
              disabled={csvUploading}
              className={`px-4 py-2 rounded text-white transition-colors ${
                csvUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#432818] hover:bg-[#5C3A2E]'
              }`}
            >
              {csvUploading ? 'Uploading...' : 'Upload CSV'}
            </button>
          </form>

          {csvError && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {csvError}
            </div>
          )}

          {csvResult && (
            <div className="mt-4 bg-green-50 border border-green-400 text-green-800 px-4 py-3 rounded">
              <p>Created: {csvResult.created}, Updated: {csvResult.updated}, Failed: {csvResult.failed.length}</p>
              {csvResult.failed.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-sm text-red-700">
                  {csvResult.failed.map((f, i) => (
                    <li key={i}>Row {f.row}: {f.error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {foodRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No food requests found</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {foodRequests.map((request) => (
              <div 
                key={request.food_id}
                className="bg-[#432818] rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-white"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-3">
                    <div>
                      <h2>Food Request ID: {request.food_id}</h2>
                      <p>Student: {request.s_name} (Roll No: {request.roll_no})</p>
                    </div>
                    <p>Type: {request.type}</p>
                    <p>Date: {new Date(request.date).toLocaleDateString()}</p>
                    {request.prescription_path && (
                      <a
                        href={request.prescription_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block underline text-sm text-white"
                      >
                        View Prescription
                      </a>
                    )}
                    </div>

                  <div className="flex flex-col items-end space-y-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[request.status]}`}>
                      {statusMapping[request.status] || request.status}
                    </span>
                    <select
                      className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-white
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={statusMapping[request.status] || request.status}
                      onChange={(e) => updateStatus(request.food_id, e.target.value)}
                      disabled={updateInProgress}
                    >
                      {Object.entries(statusMapping).map(([key, value]) => (
                        <option 
                        key={key} 
                        value={value}
                        className="bg-white text-gray-900"
                        >
                        {value}
                        </option>
                    ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WardenDashboard;