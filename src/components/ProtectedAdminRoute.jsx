// src/components/ProtectedAdminRoute.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { ref, get } from "firebase/database";

function ProtectedAdminRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const adminRef = ref(db, `admins/${user.uid}`);
        const snapshot = await get(adminRef);

        if (snapshot.exists()) {
          setAuthorized(true);
        } else {
          alert("Akun ini tidak memiliki akses admin.");
          await signOut(auth);
          navigate("/admin-login");
        }
      } else {
        navigate("/admin-login");
      }

      setChecking(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="flex items-center space-x-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
          <p className="text-blue-500 font-medium text-lg">Memeriksa akses admin...</p>
        </div>
      </div>
    );
  }

  return authorized ? children : null;
}

export default ProtectedAdminRoute;
