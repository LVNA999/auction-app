// src/components/ProtectedAdminRoute.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

function ProtectedAdminRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showLoginButton, setShowLoginButton] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
      } else {
        setShowWarning(true);
        setTimeout(() => {
          setShowLoginButton(true);
        }, 2000);
      }
      setChecking(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleRedirect = () => {
    navigate("/admin-login");
  };

  if (checking) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="flex items-center space-x-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
          <p className="text-blue-500 font-medium text-lg">Memeriksa status login...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn && showWarning) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200">
        <div className="bg-white/30 backdrop-blur-md shadow-lg rounded-xl px-10 py-8 max-w-md w-full animate-fade-in text-center border border-white/20">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Akses Ditolak
          </h2>
          <p className="text-gray-700 mb-4">
            Anda harus login sebagai admin untuk mengakses halaman ini.
          </p>
          <p className="text-gray-500 text-sm mb-6">Klik tombol di bawah untuk login.</p>

          {showLoginButton && (
            <button
              onClick={handleRedirect}
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              Login Admin
            </button>
          )}
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedAdminRoute;
