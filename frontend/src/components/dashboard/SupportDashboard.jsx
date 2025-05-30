import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SupportDashboard = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updateInProgress, setUpdateInProgress] = useState(false);

  const statusColors = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Resolved': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800'
  };

const statusMapping = {
    'PENDING': 'Pending',
    'ACTIVE': 'In Progress',
    'RESOLVED': 'Resolved',
    'REJECTED': 'Rejected'
  };
  

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/department-complaints', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        const sortedComplaints = response.data.sort((a, b) => 
          new Date(b.complaint_date) - new Date(a.complaint_date)
        );
        setComplaints(sortedComplaints);
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
      if (err.response?.status === 403) {
        navigate('/loginSupportAdmin');
      }
      setError(err.response?.data?.message || 'Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (complaintId, newStatus) => {
    setUpdateInProgress(true);
    try {
      const token = localStorage.getItem('token');
      const backendStatus = newStatus; // Send the actual string like "In Progress"
  
      console.log('Sending status update:', {
        complaintId,
        frontendStatus: newStatus,
        backendStatus
      });
  
      const response = await axios.patch(
        `http://localhost:5000/complaint/${complaintId}/status`,
        { status: backendStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (response.data.message === "Complaint status updated successfully") {
        setComplaints(prevComplaints => 
          prevComplaints.map(complaint => 
            complaint.complaint_id === complaintId 
              ? { ...complaint, status: backendStatus }
              : complaint
          )
        );
        setError('');
      }
    } catch (err) {
      console.error('Error updating status:', {
        error: err.response?.data || err.message,
        complaintId,
        newStatus
      });
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdateInProgress(false);
      await fetchComplaints();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    console.log('Auth check:', { hasToken: !!token, userType, userData });

    if (!token || userType !== 'support') {
      navigate('/login/support');
      return;
    }

    fetchComplaints();
  }, [navigate]);

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
          <h1 className="text-3xl font-bold text-gray-900">Complaints</h1>
          <button
            onClick={fetchComplaints}
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

        {complaints.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No complaints found</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {complaints.map((complaint) => (
              <div 
                key={complaint.complaint_id}
                className="bg-[#432818] rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-white"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-3">
                    <div>
                      <h2>
                        Complaint ID: {complaint.complaint_id}
                      </h2>
                      <p>
                        Student: {complaint.s_name} (Roll No: {complaint.roll_no})
                      </p>
                    </div>
                    <p>
                      Room: {complaint.room_no} | Hostel ID: {complaint.hostel_id}
                    </p>
                    <p>{complaint.description}</p>
                    <p >
                      Filed on: {new Date(complaint.complaint_date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[complaint.status]}`}>
                    {statusMapping[complaint.status] || complaint.status}
                    </span>
                    <select
                    className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm p-2 
                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={statusMapping[complaint.status] || complaint.status}
                    onChange={(e) => updateStatus(complaint.complaint_id, e.target.value)}
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

export default SupportDashboard;