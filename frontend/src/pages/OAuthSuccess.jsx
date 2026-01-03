import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const OAuthSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const role = params.get("role");

    if (token && role) {
      localStorage.setItem("token", token);
      localStorage.setItem("userType", role);
      navigate(`/dashboard/${role}`);
    } else {
      navigate("/login/student");
    }
  }, [navigate]);

  return <p className="text-center mt-20">Signing you in...</p>;
};

export default OAuthSuccess;
