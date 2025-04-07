import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

function WaitingRoom() {
  const navigate = useNavigate();
  const guestId = localStorage.getItem("guestId"); // perbaikan nama key
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    if (!guestId) return navigate("/guest-login");

    // Pantau status guest dari path /guests
    const guestRef = ref(db, `auction/guests/${guestId}`);
    const unsub = onValue(guestRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        // Jika guest sudah dihapus dari /guests,
        // cek apakah dia sudah dipindahkan ke /bidders
        const bidderRef = ref(db, `auction/bidders/${guestId}`);
        onValue(bidderRef, (bidderSnap) => {
          if (bidderSnap.exists()) {
            // Pindah ke BidderRoom
            localStorage.setItem("bidderId", guestId);
            navigate("/bidder-room");
          } else {
            setStatus("not found");
          }
        });
      } else {
        setStatus(data.status || "pending");
      }
    });

    return () => unsub();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-xl font-bold mb-2">Menunggu Verifikasi Admin...</h1>
        <p>Status: {status}</p>
      </div>
    </div>
  );
}

export default WaitingRoom;
