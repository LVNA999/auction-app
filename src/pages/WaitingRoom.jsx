import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

function WaitingRoom() {
  const navigate = useNavigate();
  const guestId = localStorage.getItem("guestId"); // gunakan guestId, bukan bidderId
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    if (!guestId) {
      navigate("/guest-login");
      return;
    }

    const guestRef = ref(db, `auction/guests/${guestId}`);
    const unsub = onValue(guestRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setStatus("not found");
        return;
      }

      const isVerified = data.verified;
      const isActive = data.active;

      setStatus(isVerified ? "verified" : "pending");

      if (isVerified && isActive) {
        // Simpan bidderId ke localStorage agar halaman BidderRoom bisa mengaksesnya
        localStorage.setItem("bidderId", guestId);
        navigate("/bidder-room");
      }
    });

    return () => unsub();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center bg-white px-8 py-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-2">Menunggu Verifikasi Admin...</h1>
        <p className="text-gray-600 mb-2">
          Status akun: <span className="font-semibold capitalize">{status}</span>
        </p>

        {status === "pending" && (
          <p className="text-sm text-orange-500">
            Mohon tunggu, akun Anda sedang menunggu verifikasi dari admin.
          </p>
        )}

        {status === "not found" && (
          <p className="text-sm text-red-500">
            Akun tidak ditemukan. Silakan login ulang.
          </p>
        )}
      </div>
    </div>
  );
}

export default WaitingRoom;
