import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Image from "react-bootstrap/Image";
import "bootstrap/dist/css/bootstrap.min.css";

const LoginForm = ({ userType }) => {
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    snu_email_id: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      let endpoint = "";
      let requestData = {};

      if (!formData.password || !(formData.email || formData.snu_email_id)) {
        throw new Error("Please fill in all fields");
      }

      switch (userType) {
        case "warden":
          endpoint = "/loginWarden";
          requestData = {
            email: formData.email,
            password: formData.password,
          };
          break;
        case "student":
          endpoint = "/loginStudent";
          requestData = {
            snu_email_id: formData.snu_email_id,
            password: formData.password,
          };
          break;
        case "support":
          endpoint = "/loginSupportAdmin";
          requestData = {
            email: formData.email,
            password: formData.password,
          };
          break;
        default:
          throw new Error("Invalid user type");
      }

      console.log("Making login request:", {
        endpoint,
        email: requestData.email || formData.snu_email_id,
        userType,
      });

      const response = await axios.post(
        `http://localhost:5000${endpoint}`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Server response:", {
        status: response.status,
        hasToken: !!response.data?.token,
        hasWardenId: !!response.data?.warden_id,
      });

      const token = response.data.token;
      if (!token) {
        throw new Error("No authentication token received");
      }

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userType", userType);
      localStorage.setItem("email", requestData.email);

      if (response.data.warden_id) {
        localStorage.setItem("warden_id", response.data.warden_id);
      }

      console.log("Authentication successful, stored data:", {
        token: token.substring(0, 10) + "...",
        userType,
        email: requestData.email,
      });
      navigate(`/dashboard/${userType}`, { replace: true });
    } catch (error) {
      console.error("Login failed:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      setError(
        error.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container h-screen">
        <div className="flex items-center justify-center h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-[1800px] bg-white rounded-lg shadow-xl p-4">
            {}
            <div className="hidden md:flex items-center justify-center bg-gray-50 rounded-l-lg overflow-hidden">
              <Image
                src="/images/student.jpg"
                fluid
                className="h-[2000px] w-[1400px] object-cover rounded-lg"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                }}
                alt="Login illustration"
              />
            </div>
            {}
            <div className="flex flex-col justify-center p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-600">Sign in as {userType}</p>
              </div>

              {error && (
                <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {userType === "student"
                        ? "SNU Email ID"
                        : "Email Address"}
                    </label>
                    <input
                      type="email"
                      required
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder={
                        userType === "student"
                          ? "Enter your SNU email"
                          : "Enter your email"
                      }
                      value={
                        userType === "student"
                          ? formData.snu_email_id
                          : formData.email
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [userType === "student" ? "snu_email_id" : "email"]:
                            e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#432818] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginForm;
