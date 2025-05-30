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
      const guestEmail = user.email;

      // Simpan di localStorage dengan key yang konsisten
      localStorage.setItem("guestId", guestId);
      localStorage.setItem("guestName", guestName);
      localStorage.setItem("guestEmail", guestEmail);

      // Cek apakah user sudah pernah login sebelumnya di /guests
      const snapshot = await get(ref(db, `auction/guests/${guestId}`));
      if (!snapshot.exists()) {
        // Simpan user baru ke database di /guests
        await set(ref(db, `auction/guests/${guestId}`), {
          name: guestName,
          email: guestEmail,
          verified: false,
          status: "pending",
          active: true,
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
