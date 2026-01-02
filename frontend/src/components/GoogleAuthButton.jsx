const GoogleAuthButton = () => {
  const API_URL = import.meta.env.VITE_API_URL;

  const handleGoogleAuth = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  return (
    <button
      type="button"
      onClick={handleGoogleAuth}
      className="w-full flex items-center justify-center gap-3 border border-gray-300 py-2 rounded-md hover:bg-gray-100 transition"
    >
      <img
        src="https://developers.google.com/identity/images/g-logo.png"
        alt="Google"
        className="w-5 h-5"
      />
      Continue with Google
    </button>
  );
};

export default GoogleAuthButton;
