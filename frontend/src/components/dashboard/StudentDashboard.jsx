import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { loadGoogleMapsScript } from "../../utils/loadGoogleMaps";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
    image: null
  });

  const [newFoodRequest, setNewFoodRequest] = useState({
    food_id: "",
    type: "",
    date: "",
    prescription: null,
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

const [carpoolRides, setCarpoolRides] = useState([]);
const [myCarpoolRides, setMyCarpoolRides] = useState([]);
const [rideFilters, setRideFilters] = useState({ date: "", place: "", time: "" });
const [newRide, setNewRide] = useState({
  from_location: "",
  from_place_id: null,
  from_lat: null,
  from_lng: null,
  to_location: "",
  to_place_id: null,
  to_lat: null,
  to_lng: null,
  date: "",
  time: "",
  seats_total: "",
});
const fromInputRef = useRef(null);
const toInputRef = useRef(null);

const [openChatRideId, setOpenChatRideId] = useState(null);
const [chatMessages, setChatMessages] = useState([]);
const [newMessageText, setNewMessageText] = useState("");

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

const fetchCarpoolRides = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Authentication required");

    const response = await axios.get(`${API_URL}/api/carpool`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCarpoolRides(response.data);
  } catch (err) {
    console.error("Error fetching carpool rides:", err);
  }
};

const fetchMyCarpoolRides = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Authentication required");

    const response = await axios.get(`${API_URL}/api/carpool/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMyCarpoolRides(response.data);
  } catch (err) {
    console.error("Error fetching my carpool rides:", err);
  }
};

const handleCreateRide = async (e) => {
  e.preventDefault();
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Authentication required");

    await axios.post(`${API_URL}/api/carpool`, newRide, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    setNewRide({
      from_location: "", from_place_id: null, from_lat: null, from_lng: null,
      to_location: "", to_place_id: null, to_lat: null, to_lng: null,
      date: "", time: "", seats_total: "",
    });
    await fetchCarpoolRides();
    await fetchMyCarpoolRides();
    setError("");
  } catch (err) {
    console.error("Error posting carpool ride:", err);
    setError(err.response?.data?.message || "Failed to post ride");
  }
};

const handleJoinRide = async (ride_id) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Authentication required");

    await axios.post(`${API_URL}/api/carpool/${ride_id}/join`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchCarpoolRides();
    await fetchMyCarpoolRides();
    setError("");
  } catch (err) {
    console.error("Error joining carpool ride:", err);
    setError(err.response?.data?.message || "Failed to send join request");
  }
};

const handleRespondToRequest = async (ride_id, roll_no, status) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Authentication required");

    await axios.patch(`${API_URL}/api/carpool/${ride_id}/requests/${roll_no}`, { status }, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    await fetchCarpoolRides();
    await fetchMyCarpoolRides();
    setError("");
  } catch (err) {
    console.error("Error responding to join request:", err);
    setError(err.response?.data?.message || "Failed to update join request");
  }
};

const handleCancelRide = async (ride_id) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Authentication required");

    await axios.delete(`${API_URL}/api/carpool/${ride_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchCarpoolRides();
    await fetchMyCarpoolRides();
    setError("");
  } catch (err) {
    console.error("Error cancelling carpool ride:", err);
    setError(err.response?.data?.message || "Failed to cancel ride");
  }
};

const fetchChatMessages = async (ride_id) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Authentication required");

    const response = await axios.get(`${API_URL}/api/carpool/${ride_id}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setChatMessages(response.data);
  } catch (err) {
    console.error("Error fetching chat messages:", err);
  }
};

const handleSendMessage = async (e) => {
  e.preventDefault();
  if (!newMessageText.trim() || !openChatRideId) return;

  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Authentication required");

    await axios.post(
      `${API_URL}/api/carpool/${openChatRideId}/messages`,
      { text: newMessageText },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
    setNewMessageText("");
    await fetchChatMessages(openChatRideId);
  } catch (err) {
    console.error("Error sending chat message:", err);
    setError(err.response?.data?.message || "Failed to send message");
  }
};

const toggleChat = (ride_id) => {
  if (openChatRideId === ride_id) {
    setOpenChatRideId(null);
    setChatMessages([]);
  } else {
    setOpenChatRideId(ride_id);
    fetchChatMessages(ride_id);
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

      const formData = new FormData();
      formData.append("description", newComplaint.description);
      formData.append("hostel_id", newComplaint.hostel_id);
      formData.append("d_name", newComplaint.d_name);
      if (newComplaint.image) {
        formData.append("image", newComplaint.image);
      }

      await axios.post(`${API_URL}/complaint`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setNewComplaint({
        description: "",
        hostel_id: "",
        d_name: "",
        image: null,
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
      if (!newFoodRequest.prescription) {
        setError("Please attach a prescription image or PDF");
        return;
      }

      const formData = new FormData();
      formData.append("food_id", newFoodRequest.food_id);
      formData.append("type", newFoodRequest.type);
      formData.append("date", newFoodRequest.date);
      formData.append("prescription", newFoodRequest.prescription);

      await axios.post(
        `${API_URL}/api/foodrequest`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setNewFoodRequest({ food_id: "", type: "", date: "", prescription: null });
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
      } else if (activeTab === "carpool") {
        await fetchCarpoolRides();
        await fetchMyCarpoolRides();
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

  // Sync tab from URL (?section=complaints|food|lostfound|profile)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get("section");
    if (section && ["complaints", "food", "lostfound", "carpool", "profile"].includes(section)) {
      setActiveTab(section);
    }
  }, [location.search]);

  // Wire up Places Autocomplete on the From/To fields once the Carpool tab is showing
  useEffect(() => {
    if (activeTab !== "carpool") return;

    let fromAutocomplete;
    let toAutocomplete;

    loadGoogleMapsScript()
      .then((google) => {
        if (fromInputRef.current) {
          fromAutocomplete = new google.maps.places.Autocomplete(fromInputRef.current);
          fromAutocomplete.addListener("place_changed", () => {
            const place = fromAutocomplete.getPlace();
            setNewRide((prev) => ({
              ...prev,
              from_location: place.formatted_address || place.name || prev.from_location,
              from_place_id: place.place_id || null,
              from_lat: place.geometry?.location?.lat() ?? null,
              from_lng: place.geometry?.location?.lng() ?? null,
            }));
          });
        }

        if (toInputRef.current) {
          toAutocomplete = new google.maps.places.Autocomplete(toInputRef.current);
          toAutocomplete.addListener("place_changed", () => {
            const place = toAutocomplete.getPlace();
            setNewRide((prev) => ({
              ...prev,
              to_location: place.formatted_address || place.name || prev.to_location,
              to_place_id: place.place_id || null,
              to_lat: place.geometry?.location?.lat() ?? null,
              to_lng: place.geometry?.location?.lng() ?? null,
            }));
          });
        }
      })
      .catch((err) => console.error("Failed to load Google Maps:", err));

    return () => {
      if (window.google?.maps?.event) {
        if (fromAutocomplete) window.google.maps.event.clearInstanceListeners(fromAutocomplete);
        if (toAutocomplete) window.google.maps.event.clearInstanceListeners(toAutocomplete);
      }
    };
  }, [activeTab]);

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

  // Poll the open chat thread for new messages every few seconds
  useEffect(() => {
    if (!openChatRideId) return;

    const interval = setInterval(() => {
      fetchChatMessages(openChatRideId);
    }, 4000);

    return () => clearInterval(interval);
  }, [openChatRideId]);

  const filteredCarpoolRides = carpoolRides.filter((ride) => {
    if (rideFilters.date && new Date(ride.date).toISOString().split("T")[0] !== rideFilters.date) {
      return false;
    }
    if (rideFilters.time && ride.time !== rideFilters.time) {
      return false;
    }
    if (rideFilters.place) {
      const term = rideFilters.place.toLowerCase();
      const matches =
        ride.from_location.toLowerCase().includes(term) ||
        ride.to_location.toLowerCase().includes(term);
      if (!matches) return false;
    }
    return true;
  });

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
            onClick={() => setActiveTab("carpool")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "carpool"
                ? "bg-[#432818] text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Carpool
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

{activeTab === "carpool" && (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold text-gray-900">Carpool</h1>
      <button
        onClick={() => { fetchCarpoolRides(); fetchMyCarpoolRides(); }}
        className="px-4 py-2 bg-[#432818] text-white rounded hover:opacity-90 transition-opacity"
      >
        Refresh
      </button>
    </div>

    {/* Post a Ride */}
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Post a Ride</h2>
      <form onSubmit={handleCreateRide} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2">From</label>
            <input
              ref={fromInputRef}
              type="text"
              className="w-full p-2 border rounded"
              value={newRide.from_location}
              onChange={(e) => setNewRide({ ...newRide, from_location: e.target.value, from_place_id: null, from_lat: null, from_lng: null })}
              required
              placeholder="e.g. Campus Gate 2"
            />
          </div>
          <div>
            <label className="block mb-2">To</label>
            <input
              ref={toInputRef}
              type="text"
              className="w-full p-2 border rounded"
              value={newRide.to_location}
              onChange={(e) => setNewRide({ ...newRide, to_location: e.target.value, to_place_id: null, to_lat: null, to_lng: null })}
              required
              placeholder="e.g. IGI Airport"
            />
          </div>
          <div>
            <label className="block mb-2">Date</label>
            <input
              type="date"
              className="w-full p-2 border rounded"
              value={newRide.date}
              onChange={(e) => setNewRide({ ...newRide, date: e.target.value })}
              required
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div>
            <label className="block mb-2">Time</label>
            <input
              type="time"
              className="w-full p-2 border rounded"
              value={newRide.time}
              onChange={(e) => setNewRide({ ...newRide, time: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block mb-2">Seats available</label>
            <input
              type="number"
              min="1"
              className="w-full p-2 border rounded"
              value={newRide.seats_total}
              onChange={(e) => setNewRide({ ...newRide, seats_total: e.target.value })}
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="bg-[#432818] text-white px-4 py-2 rounded hover:opacity-90 transition-opacity"
        >
          Post Ride
        </button>
      </form>
    </div>

    {/* My Rides */}
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">My Rides</h2>
      {myCarpoolRides.length === 0 ? (
        <p className="text-gray-500">You haven't posted or joined any rides yet.</p>
      ) : (
        <div className="space-y-4">
          {myCarpoolRides.map((ride) => (
            <div key={ride.ride_id} className="border rounded-lg p-4">
              <p className="font-semibold text-lg">{ride.from_location} → {ride.to_location}</p>
              <p className="mt-1 text-sm text-gray-600">
                {new Date(ride.date).toLocaleDateString()} at {ride.time} · Status: {ride.status}
              </p>

              {ride.is_creator ? (
                <>
                  <p className="mt-2 text-sm text-gray-600">
                    Seats: {ride.seats_approved} / {ride.seats_total} filled
                  </p>
                  <div className="mt-3 space-y-2">
                    {ride.join_requests.length === 0 ? (
                      <p className="text-sm text-gray-500">No join requests yet.</p>
                    ) : (
                      ride.join_requests.map((jr) => (
                        <div key={jr.roll_no} className="flex items-center justify-between bg-gray-50 rounded p-2">
                          <span className="text-sm">
                            {jr.s_name} ({jr.roll_no}) — {jr.status}
                            {jr.status === "Approved" && jr.contact_no && ` · ${jr.contact_no}`}
                          </span>
                          {jr.status === "Pending" && (
                            <div className="space-x-2">
                              <button
                                onClick={() => handleRespondToRequest(ride.ride_id, jr.roll_no, "Approved")}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:opacity-90"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRespondToRequest(ride.ride_id, jr.roll_no, "Rejected")}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:opacity-90"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  {ride.status !== "Cancelled" && (
                    <button
                      onClick={() => handleCancelRide(ride.ride_id)}
                      className="mt-3 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:opacity-90"
                    >
                      Cancel Ride
                    </button>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm">
                  Posted by {ride.creator_name} · Your request: <span className="font-medium">{ride.my_request?.status}</span>
                  {ride.my_request?.status === "Approved" && ride.creator_contact && ` · Contact: ${ride.creator_contact}`}
                </p>
              )}

              <button
                onClick={() => toggleChat(ride.ride_id)}
                className="mt-3 px-3 py-1 bg-[#432818] text-white text-sm rounded hover:opacity-90"
              >
                {openChatRideId === ride.ride_id ? "Close Chat" : "Chat"}
              </button>

              {openChatRideId === ride.ride_id && (
                <div className="mt-3 border rounded-lg p-3 bg-gray-50">
                  <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
                    {chatMessages.length === 0 ? (
                      <p className="text-sm text-gray-500">No messages yet. Say hello!</p>
                    ) : (
                      chatMessages.map((msg) => (
                        <div key={msg._id} className="text-sm">
                          <span className="font-medium">{msg.sender_name}:</span> {msg.text}
                          <span className="ml-2 text-xs text-gray-400">
                            {new Date(msg.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 p-2 border rounded text-sm"
                      placeholder="Type a message..."
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-[#432818] text-white text-sm rounded hover:opacity-90"
                    >
                      Send
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Browse Rides */}
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Available Rides</h2>

      <div className="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block mb-1 text-sm">Date</label>
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={rideFilters.date}
            onChange={(e) => setRideFilters({ ...rideFilters, date: e.target.value })}
          />
        </div>
        <div>
          <label className="block mb-1 text-sm">Place (from or to)</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="e.g. Airport"
            value={rideFilters.place}
            onChange={(e) => setRideFilters({ ...rideFilters, place: e.target.value })}
          />
        </div>
        <div>
          <label className="block mb-1 text-sm">Time</label>
          <input
            type="time"
            className="w-full p-2 border rounded"
            value={rideFilters.time}
            onChange={(e) => setRideFilters({ ...rideFilters, time: e.target.value })}
          />
        </div>
        <button
          onClick={() => setRideFilters({ date: "", place: "", time: "" })}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Clear Filters
        </button>
      </div>

      {filteredCarpoolRides.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">
            {carpoolRides.length === 0 ? "No rides posted yet" : "No rides match your filters"}
          </p>
        </div>
      ) : (
        filteredCarpoolRides.map((ride) => (
          <div key={ride.ride_id} className="bg-[#432818] text-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-lg">{ride.from_location} → {ride.to_location}</p>
                <p className="mt-2">{new Date(ride.date).toLocaleDateString()} at {ride.time}</p>
                <p className="mt-2">Posted by: {ride.creator_name}</p>
                <p className="mt-2">Seats: {ride.seats_available} / {ride.seats_total} available</p>
                <p className="mt-2 text-sm opacity-75">Status: {ride.status}</p>
              </div>
              {!ride.is_creator && (
                ride.my_request ? (
                  <span className="px-3 py-2 bg-white/20 rounded text-sm">
                    Request {ride.my_request.status}
                  </span>
                ) : (
                  <button
                    onClick={() => handleJoinRide(ride.ride_id)}
                    disabled={ride.status !== "Open" || ride.seats_available <= 0}
                    className="px-4 py-2 bg-white text-[#432818] rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Request to Join
                  </button>
                )
              )}
            </div>
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
                <div>
                  <label className="block mb-2">Upload Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    className="w-full p-2 border rounded"
                    onChange={(e) =>
                      setNewComplaint({
                        ...newComplaint,
                        image: e.target.files ? e.target.files[0] : null,
                      })
                    }
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Supported formats: JPG, JPEG, PNG (Max 5MB)
                  </p>
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
                    <p className="mt-2">{complaint.description}</p>                    {complaint.image_path && (
                      <div className="mt-4">
                        <img
                          src={complaint.image_path}
                          alt="Complaint"
                          className="max-w-xs rounded-lg shadow-md"
                        />
                      </div>
                    )}                    <p className="mt-2 text-sm opacity-75">
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
                <div>
                  <label className="block mb-2">Prescription (image or PDF)</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="w-full p-2 border rounded"
                    onChange={(e) =>
                      setNewFoodRequest({
                        ...newFoodRequest,
                        prescription: e.target.files[0] || null,
                      })
                    }
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Required for warden to verify before approval.
                  </p>
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
                    {request.prescription_path && (
                      <a
                        href={request.prescription_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block underline text-sm"
                      >
                        View Prescription
                      </a>
                    )}
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
