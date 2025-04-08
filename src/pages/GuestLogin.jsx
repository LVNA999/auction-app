// GuestLogin.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { ref, set, get } from "firebase/database";

function GuestLogin() {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const guestId = user.uid;
      const guestName = user.displayName;

      // Simpan di localStorage
      localStorage.setItem("guestId", guestId);
      localStorage.setItem("guestName", guestName);

      // Cek apakah user sudah pernah login sebelumnya
      const snapshot = await get(ref(db, `auction/guests/${guestId}`));
      if (!snapshot.exists()) {
        // Simpan user baru ke database
        await set(ref(db, `auction/guests/${guestId}`), {
          name: guestName,
          status: "pending",
        });
      }

      alert("Login berhasil. Menunggu verifikasi admin.");
      navigate("/waiting-room");
    } catch (error) {
      console.error("Google sign-in error", error);
      alert("Login gagal. Coba lagi.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow w-96 text-center">
        <h1 className="text-2xl font-bold mb-6">Login sebagai Guest</h1>
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded"
        >
          Login dengan Gmail
        </button>
      </div>
    </div>
  );
}

export default GuestLogin;
