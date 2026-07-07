import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const hasRun = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode's double effect invocation in dev: the
    // first run navigates away, which changes window.location.search before
    // the second invocation reads it, causing it to see no token and bounce
    // to the login page.
    if (hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const role = params.get("role");

    if (token && role) {
      localStorage.setItem("token", token);
      localStorage.setItem("userType", role);
      localStorage.setItem("lastLogin", Date.now().toString());
      navigate(`/dashboard/${role}`);
    } else {
      navigate("/login/student");
    }
  }, [navigate]);

  return <p className="text-center mt-20">Signing you in...</p>;
};

export default OAuthSuccess;
