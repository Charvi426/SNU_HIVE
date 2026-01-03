import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    googleId: "",
    roll_no: "",
    dept: "",
    batch: "",
    contact_no: "",
    room_no: "",
    hostel_id: "",
    parent_contact: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const role = params.get("role");
    const newStatus = params.get("status");

    if (token && role) {
      // Existing user - login
      localStorage.setItem("token", token);
      localStorage.setItem("userType", role);
      navigate(`/dashboard/${role}`);
    } else if (newStatus === "new") {
      // New user - show completion form
      setFormData({
        email: params.get("email") || "",
        name: params.get("name") || "",
        googleId: params.get("googleId") || "",
        roll_no: "",
        dept: "",
        batch: "",
        contact_no: "",
        room_no: "",
        hostel_id: "",
        parent_contact: "",
      });
      setStatus("new");
    } else {
      navigate("/login/student");
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await axios.post(
        `${API_URL}/auth/google/complete-signup`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userType", response.data.role);
        navigate("/dashboard/student");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to complete signup. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return <p className="text-center mt-20">Signing you in...</p>;
  }

  if (status === "new") {
    return (
      <div className="min-h-screen bg-gray-50 p-8 sm:p-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-[#432818] mb-6">
              Complete Your Profile
            </h2>
            <p className="text-gray-600 mb-6">
              We found your SNU email. Please complete your profile to finish signup.
            </p>

            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SNU Email (Read-only)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    readOnly
                    className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (Read-only)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    readOnly
                    className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    name="roll_no"
                    value={formData.roll_no}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#432818] focus:border-[#432818]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    name="dept"
                    value={formData.dept}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#432818] focus:border-[#432818]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch
                  </label>
                  <input
                    type="number"
                    name="batch"
                    value={formData.batch}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#432818] focus:border-[#432818]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="contact_no"
                    value={formData.contact_no}
                    onChange={handleInputChange}
                    placeholder="10 digit number"
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#432818] focus:border-[#432818]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    name="room_no"
                    value={formData.room_no}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#432818] focus:border-[#432818]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hostel ID
                  </label>
                  <input
                    type="text"
                    name="hostel_id"
                    value={formData.hostel_id}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#432818] focus:border-[#432818]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Contact Number
                  </label>
                  <input
                    type="tel"
                    name="parent_contact"
                    value={formData.parent_contact}
                    onChange={handleInputChange}
                    placeholder="10 digit number"
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#432818] focus:border-[#432818]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2 px-4 rounded-md font-medium text-white transition-colors ${
                  isSubmitting
                    ? "bg-[#8B7355] cursor-not-allowed"
                    : "bg-[#432818] hover:bg-[#5C3A2E]"
                }`}
              >
                {isSubmitting ? "Completing Signup..." : "Complete Signup"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default OAuthSuccess;
