import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("complaints");
  const [complaints, setComplaints] = useState([]);
  const [foodRequests, setFoodRequests] = useState([]);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [newComplaint, setNewComplaint] = useState({
    description: "",
    hostel_id: "",
    d_name: "",
  });

  const [newFoodRequest, setNewFoodRequest] = useState({
    food_id: "",
    type: "",
    date: "",
  });

// Add after other useState declarations
const [lostFoundItems, setLostFoundItems] = useState([]);
const [newLostFound, setNewLostFound] = useState({
  item_name: "",
  found_location: "",
  status: "LOST",
  phone_number: "",
  image: null
});
const API_URL = import.meta.env.VITE_API_URL;
// Add after other fetch functions
const fetchLostFoundItems = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Authentication required");

    const response = await axios.get(
      `${API_URL}/api/lostfound`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("Lost and Found items:", response.data);
    setLostFoundItems(response.data);
  } catch (err) {
    console.error("Error fetching lost and found items:", err);
  }
};

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required");

      const response = await axios.get(
        `${API_URL}/complaint/student`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Complaints data:", response.data);
      setComplaints(response.data);
      setError("");
    } catch (err) {
      console.error("Fetch error:", err);
      if (err.response?.status === 401) {
        navigate("/login/student");
      } else {
        //setError(err.message || "Failed to fetch complaints");
      }
    }
  };

  const fetchFoodRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required");

      const response = await axios.get(
        `${API_URL}/api/foodrequest/student`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Food requests:", response.data);
      setFoodRequests(response.data);
    } catch (err) {
      console.error("Error fetching food requests:", err);
      //setError(err.response?.data?.message || "Failed to fetch food requests");
    }
  };

// Add after other submit handlers
const handleLostFoundSubmit = async (e) => {
  e.preventDefault();
  try {
    const token = localStorage.getItem("token");
     if (!token) {
      setError("Authentication required");
      return;
    }

    console.log('Token being sent:', token); // Debug log


    const formData = new FormData();
    formData.append('item_name', newLostFound.item_name);
    formData.append('found_location', newLostFound.found_location);
    formData.append('status', newLostFound.status);
    formData.append('phone_number', newLostFound.phone_number);
    if (newLostFound.image) {
      formData.append('image', newLostFound.image);
    }

    await axios.post(`${API_URL}/api/lostfound`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    setNewLostFound({
      item_name: "",
      found_location: "",
      status: "LOST",
      phone_numer: "",
      image: null
    });
    await fetchLostFoundItems();
  } catch (err) {
    console.error("Lost and Found submission error:", err);
    setError(err.response?.data?.message || "Failed to submit lost and found item");
  }
};

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required");

      await axios.post(`${API_URL}/complaint`, newComplaint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setNewComplaint({
        description: "",
        hostel_id: "",
        d_name: "",
      });
      await fetchComplaints();
      setError("");
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.response?.data?.message || "Failed to submit complaint");
    }
  };

  const handleFoodRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required");

      await axios.post(
        `${API_URL}/api/foodrequest`,
        newFoodRequest,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setNewFoodRequest({ food_id: "", type: "", date: "" });
      await fetchFoodRequests();
    } catch (err) {
      console.error("Food request submission error:", err);
      setError(err.response?.data?.message || "Failed to submit food request");
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        const userType = localStorage.getItem("userType");

        if (!token || userType !== "student") {
          console.log("Invalid auth data, redirecting to login");
          navigate("/login/student");
          return;
        }
if (activeTab === "complaints") {
        await fetchComplaints();
      } else if (activeTab === "food") {
        await fetchFoodRequests();
      } else if (activeTab === "lostfound") {
        await fetchLostFoundItems();
      }
      } catch (err) {
        console.error("Dashboard initialization failed:", err);
        setError("Failed to initialize dashboard");
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [navigate, activeTab]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required");

      const response = await axios.get(
        `${API_URL}/api/student/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setProfile(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err.response?.data?.message || "Failed to fetch profile");
    }
  };

  useEffect(() => {
    if (activeTab === "profile") {
      fetchProfile();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#432818]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab("complaints")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "complaints"
                ? "bg-[#432818] text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Complaints
          </button>
          <button
            onClick={() => setActiveTab("food")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "food"
                ? "bg-[#432818] text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Food Requests
          </button>

          <button
            onClick={() => setActiveTab("lostfound")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "lostfound"
                ? "bg-[#432818] text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Lost & Found
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "profile"
                ? "bg-[#432818] text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Profile
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

{activeTab === "lostfound" && (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold text-gray-900">Lost & Found</h1>
      <button
        onClick={fetchLostFoundItems}
        className="px-4 py-2 bg-[#432818] text-white rounded hover:opacity-90 transition-opacity"
      >
        Refresh
      </button>
    </div>

    {/* Lost and Found Form */}
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Report Lost/Found Item</h2>
      <form onSubmit={handleLostFoundSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Item Name</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={newLostFound.item_name}
            onChange={(e) =>
              setNewLostFound({
                ...newLostFound,
                item_name: e.target.value,
              })
            }
            required
            placeholder="Enter item name"
          />
        </div>
        <div>
          <label className="block mb-2">Location</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={newLostFound.found_location}
            onChange={(e) =>
              setNewLostFound({
                ...newLostFound,
                found_location: e.target.value,
              })
            }
            required
            placeholder="Enter location"
          />
        </div>
        <div>
          <label className="block mb-2">Status</label>
          <select
            className="w-full p-2 border rounded"
            value={newLostFound.status}
            onChange={(e) =>
              setNewLostFound({
                ...newLostFound,
                status: e.target.value,
              })
            }
             required
          >
            <option value="LOST">Lost</option>
            <option value="FOUND">Found</option>
          </select>
        </div>
        <div>
          <label className="block mb-2">Phone number</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={newLostFound.phone_number}
            onChange={(e) =>
              setNewLostFound({
                ...newLostFound,
                phone_number: e.target.value,
              })
            }
            required
            placeholder="Enter Phone number"
          />
        </div>
        <div>
          <label className="block mb-2">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setNewLostFound({
                ...newLostFound,
                image: e.target.files[0],
              })
            }
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          className="bg-[#432818] text-white px-4 py-2 rounded hover:opacity-90 transition-opacity"
        >
          Submit Report
        </button>
      </form>
    </div>

    {/* Lost and Found List */}
    <div className="space-y-4">
      {lostFoundItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">No items found</p>
        </div>
      ) : (
        lostFoundItems.map((item) => (
          <div
            key={item.item_id}
            className="bg-[#432818] text-white rounded-lg shadow p-6"
          >
            {item.image_path && (
              <img
                src={item.image_path}
                alt={item.item_name}
                className="w-32 h-32 object-cover rounded mb-4"
              />
            )}
            <p className="font-semibold">Item: {item.item_name}</p>
            <p className="mt-2">Location: {item.found_location}</p>
            <p className="mt-2">Status: {item.status}</p>
            <p classname="mt-2">Phone number:  {item.phone_number}</p>
            <p className="mt-2 text-sm opacity-75">
              Reported on: {new Date(item.report_date).toLocaleDateString()}
            </p>
          </div>
        ))
      )}
    </div>
  </div>
)}

        {/* Complaints Section */}
        {activeTab === "complaints" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Your Complaints
              </h1>
              <button
                onClick={fetchComplaints}
                className="px-4 py-2 bg-[#432818] text-white rounded hover:opacity-90 transition-opacity"
              >
                Refresh
              </button>
            </div>

            {/* Complaint Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">New Complaint</h2>
              <form onSubmit={handleComplaintSubmit} className="space-y-4">
                <div>
                  <label className="block mb-2">Department</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={newComplaint.d_name}
                    onChange={(e) =>
                      setNewComplaint({
                        ...newComplaint,
                        d_name: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Pest-Control">Pest Control</option>
                    <option value="IT">IT</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Housekeeping">Housekeeping</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2">Hostel ID</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={newComplaint.hostel_id}
                    onChange={(e) =>
                      setNewComplaint({
                        ...newComplaint,
                        hostel_id: e.target.value,
                      })
                    }
                    required
                    placeholder="Enter hostel ID"
                  />
                </div>
                <div>
                  <label className="block mb-2">Description</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    value={newComplaint.description}
                    onChange={(e) =>
                      setNewComplaint({
                        ...newComplaint,
                        description: e.target.value,
                      })
                    }
                    required
                    placeholder="Describe your complaint"
                    rows="4"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#432818] text-white px-4 py-2 rounded hover:opacity-90 transition-opacity"
                >
                  Submit Complaint
                </button>
              </form>
            </div>

            {/* Complaints List */}
            <div className="space-y-4">
              {complaints.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-gray-500 text-lg">No complaints found</p>
                </div>
              ) : (
                complaints.map((complaint) => (
                  <div
                    key={complaint.complaint_id}
                    className="bg-[#432818] text-white rounded-lg shadow p-6"
                  >
                    <p className="font-semibold">
                      ID: {complaint.complaint_id}
                    </p>
                    <p className="mt-2">Department: {complaint.d_name}</p>
                    <p className="mt-2">{complaint.description}</p>
                    <p className="mt-2 text-sm opacity-75">
                      Status: {complaint.status} | Filed on:{" "}
                      {new Date(complaint.complaint_date).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Food Requests Section */}
        {activeTab === "food" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Food Requests
              </h1>
              <button
                onClick={fetchFoodRequests}
                className="px-4 py-2 bg-[#432818] text-white rounded hover:opacity-90 transition-opacity"
              >
                Refresh
              </button>
            </div>

            {/* Food Request Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">New Food Request</h2>
              <form onSubmit={handleFoodRequestSubmit} className="space-y-4">
                <div>
                  <label className="block mb-2">Food ID</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={newFoodRequest.food_id}
                    onChange={(e) =>
                      setNewFoodRequest({
                        ...newFoodRequest,
                        food_id: e.target.value,
                      })
                    }
                    required
                    pattern="\d{4}"
                    placeholder="Enter 4-digit food ID"
                  />
                </div>
                <div>
                  <label className="block mb-2">Meal Type</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={newFoodRequest.type}
                    onChange={(e) =>
                      setNewFoodRequest({
                        ...newFoodRequest,
                        type: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Select meal type</option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2">Date</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded"
                    value={newFoodRequest.date}
                    onChange={(e) =>
                      setNewFoodRequest({
                        ...newFoodRequest,
                        date: e.target.value,
                      })
                    }
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#432818] text-white px-4 py-2 rounded hover:opacity-90 transition-opacity"
                >
                  Submit Food Request
                </button>
              </form>
            </div>

            {/* Food Requests List */}
            <div className="space-y-4">
              {foodRequests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-gray-500 text-lg">
                    No food requests found
                  </p>
                </div>
              ) : (
                foodRequests.map((request) => (
                  <div
                    key={`${request.food_id}-${request.date}`}
                    className="bg-[#432818] text-white rounded-lg shadow p-6"
                  >
                    <p className="font-semibold">Food ID: {request.food_id}</p>
                    <p className="mt-2">Type: {request.type}</p>
                    <p className="mt-2">
                      Date: {new Date(request.date).toLocaleDateString()}
                    </p>
                    <p className="mt-2 text-sm opacity-75">
                      Status: {request.status}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {activeTab === "profile" && (
      profile ? (
        <div className="bg-white rounded-lg shadow p-6 mx-4 my-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700">Name</h3>
              <p className="mt-1">{profile.s_name}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">Roll Number</h3>
              <p className="mt-1">{profile.roll_no}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">Department</h3>
              <p className="mt-1">{profile.dept}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">Batch</h3>
              <p className="mt-1">{profile.batch}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">Contact Number</h3>
              <p className="mt-1">{profile.contact_no}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">Email</h3>
              <p className="mt-1">{profile.snu_email_id}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">Room Number</h3>
              <p className="mt-1">{profile.room_no}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">Hostel</h3>
              <p className="mt-1">
                {profile.h_name} ({profile.hostel_id})
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">Parent Contact</h3>
              <p className="mt-1">{profile.parent_contact}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center ">
          <p className="text-gray-500 text-lg"></p>
        </div>
      ))}
    </div>
  );
};

export default StudentDashboard;
