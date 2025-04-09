import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue, update } from "firebase/database";
import { useNavigate } from "react-router-dom";

function BidderRoom() {
  const [currentPrice, setCurrentPrice] = useState(0);
  const [status, setStatus] = useState(null);
  const [guestId, setGuestId] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [itemImage, setItemImage] = useState("");
  const [itemName, setItemName] = useState("Barang Lelang");
  const [itemDescription, setItemDescription] = useState("Deskripsi belum tersedia.");

  const [timerEnd, setTimerEnd] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const navigate = useNavigate();

  // Ambil ID dari localStorage
  useEffect(() => {
    const storedId = localStorage.getItem("bidderId");
    if (!storedId) {
      navigate("/guest-login");
      return;
    }
    setGuestId(storedId);
  }, [navigate]);

  // Pantau status guest
  useEffect(() => {
    if (!guestId) return;
    const guestRef = ref(db, `auction/guests/${guestId}`);

    const unsub = onValue(guestRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStatus(data.status || null);
        setIsVerified(data.verified ?? false);
        setIsActive(data.active ?? false);
      } else {
        localStorage.removeItem("bidderId");
        alert("Akun tidak ditemukan. Silakan login ulang.");
        navigate("/guest-login");
      }
      setIsLoading(false);
    });

    return () => unsub();
  }, [guestId, navigate]);

  // Pantau data lelang
  useEffect(() => {
    const priceRef = ref(db, "auction/currentPrice");
    const endRef = ref(db, "auction/ended");
    const itemRef = ref(db, "auction/item");
    const timerRef = ref(db, "auction/timerEnd");

    const unsubPrice = onValue(priceRef, (snapshot) => {
      const val = snapshot.val();
      if (val !== null) setCurrentPrice(val);
    });

    const unsubItem = onValue(itemRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setItemImage(data.image || "");
        setItemName(data.name || "Barang Lelang");
        setItemDescription(data.description || "Deskripsi belum tersedia.");
      }
    });

    const unsubTimer = onValue(timerRef, (snap) => {
      const end = snap.val();
      setTimerEnd(end);
    });

    return () => {
      unsubPrice();
      unsubItem();
      unsubTimer();
    };
  }, []);

  // Update countdown timer setiap detik
  useEffect(() => {
    if (!timerEnd) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((timerEnd - now) / 1000));
      setTimeLeft(diff);

      if (diff <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerEnd]);

  const submitStatus = (newStatus) => {
    if (!guestId) return;
    const guestRef = ref(db, `auction/guests/${guestId}`);
    update(guestRef, {
      status: newStatus,
      timestamp: Date.now(),
    });
  };

  const handleCall = () => {
    setStatus("CALL");
    submitStatus("call");
  };

  const handleFold = () => {
    setStatus("FOLD");
    submitStatus("fold");
  };

  const hasFolded = status?.toLowerCase() === "fold";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center text-gray-600">Memuat data akun...</div>
      </div>
    );
  }

  if (!isVerified || !isActive) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center bg-white px-6 py-4 rounded shadow">
          <h1 className="text-xl font-bold mb-2 text-red-600">Akses Ditolak</h1>
          <p className="text-gray-700">
            Akun kamu belum diverifikasi atau belum diaktifkan oleh admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Bidding Room</h1>

        <p className="text-sm text-gray-500 mb-2">
          ID Kamu: <strong>{guestId}</strong>
        </p>

        <div className="mb-4">
          <img
            src={itemImage || "https://via.placeholder.com/300x200.png?text=Barang+Lelang"}
            alt="Barang Lelang"
            className="rounded w-full object-cover max-h-60"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <h2 className="text-xl font-semibold mt-2">{itemName}</h2>
          <p>{itemDescription}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded mb-4">
          <p className="text-lg font-medium">Harga saat ini:</p>
          <p className="text-2xl font-bold text-blue-600">
            Rp {currentPrice.toLocaleString()}
          </p>
        </div>

        {timeLeft > 0 && (
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-600">Waktu tersisa untuk CALL/FOLD:</p>
            <p className="text-2xl font-bold text-red-600">{timeLeft} detik</p>
          </div>
        )}

        {!hasFolded ? (
          <div className="flex space-x-4 mb-4">
            <button
              className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
              onClick={handleCall}
              disabled={timeLeft <= 0}
            >
              CALL
            </button>
            <button
              className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
              onClick={handleFold}
              disabled={timeLeft <= 0}
            >
              FOLD
            </button>
          </div>
        ) : (
          <p className="text-yellow-600 font-semibold text-center mb-4">
            Kamu dinyatakan <strong>FOLD</strong> karena tidak melakukan call pada harga sebelumnya.
            Kamu hanya bisa menonton lelang ini.
          </p>
        )}

        {status && (
          <p className="text-center mb-4">
            Kamu memilih:{" "}
            <span className="font-semibold text-indigo-600">{status.toUpperCase()}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default BidderRoom;
