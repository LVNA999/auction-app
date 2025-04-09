import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue, update } from "firebase/database";
import { useNavigate } from "react-router-dom";

function BidderRoom() {
  const [guestId, setGuestId] = useState("");
  const [status, setStatus] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [currentPrice, setCurrentPrice] = useState(0);
  const [itemImage, setItemImage] = useState("");
  const [itemName, setItemName] = useState("Barang Lelang");
  const [itemDescription, setItemDescription] = useState("Deskripsi belum tersedia.");
  const [auctionEnded, setAuctionEnded] = useState(false);

  const [timerEnd, setTimerEnd] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const navigate = useNavigate();

  // Ambil ID dari localStorage
  useEffect(() => {
    const id = localStorage.getItem("bidderId");
    if (!id) {
      navigate("/guest-login");
    } else {
      setGuestId(id);
    }
  }, [navigate]);

  // Pantau data bidder
  useEffect(() => {
    if (!guestId) return;
    const guestRef = ref(db, `auction/guests/${guestId}`);
    return onValue(guestRef, (snap) => {
      const data = snap.val();
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
  }, [guestId, navigate]);

  // Pantau data lelang
  useEffect(() => {
    const priceRef = ref(db, "auction/currentPrice");
    const itemRef = ref(db, "auction/item");
    const endRef = ref(db, "auction/ended");
    const timerRef = ref(db, "auction/timerEnd");

    const unsubPrice = onValue(priceRef, (snap) => {
      const val = snap.val();
      if (val !== null) setCurrentPrice(val);
    });

    const unsubItem = onValue(itemRef, (snap) => {
      const data = snap.val();
      if (data) {
        setItemImage(data.image || "");
        setItemName(data.name || "Barang Lelang");
        setItemDescription(data.description || "Deskripsi belum tersedia.");
      }
    });

    const unsubEnd = onValue(endRef, (snap) => {
      setAuctionEnded(!!snap.val());
    });

    const unsubTimer = onValue(timerRef, (snap) => {
      const end = snap.val();
      setTimerEnd(end);
    });

    return () => {
      unsubPrice();
      unsubItem();
      unsubEnd();
      unsubTimer();
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!timerEnd) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((timerEnd - now) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
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
    setStatus("call");
    submitStatus("call");
  };

  const handleFold = () => {
    setStatus("fold");
    submitStatus("fold");
  };

  const hasFolded = status?.toLowerCase() === "fold";

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-gray-600">Memuat data akun...</p>
      </div>
    );
  }

  if (!isVerified || !isActive) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="bg-white p-6 rounded shadow text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Akses Ditolak</h2>
          <p>Akun kamu belum diverifikasi atau belum diaktifkan oleh admin.</p>
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
            src={itemImage}
            alt="Barang Lelang"
            className="rounded w-full object-cover max-h-60"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <h2 className="text-xl font-semibold mt-2">{itemName}</h2>
          <p>{itemDescription}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded mb-4">
          <p className="text-lg font-medium">Harga Saat Ini:</p>
          <p className="text-2xl font-bold text-blue-600">
            Rp {currentPrice.toLocaleString()}
          </p>
        </div>

        {timeLeft > 0 && !hasFolded && (
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">Waktu tersisa:</p>
            <p className="text-2xl font-bold text-red-600">{timeLeft} detik</p>
          </div>
        )}

        {!hasFolded ? (
          <div className="flex gap-4 mb-4 justify-center">
            <button
              onClick={handleCall}
              disabled={timeLeft <= 0}
              className={`px-6 py-2 rounded text-white ${
                timeLeft > 0
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              CALL
            </button>
            <button
              onClick={handleFold}
              disabled={timeLeft <= 0}
              className={`px-6 py-2 rounded text-white ${
                timeLeft > 0
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
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
          <p className="text-center text-sm text-gray-700">
            Pilihan kamu: <span className="font-bold text-indigo-600">{status.toUpperCase()}</span>
          </p>
        )}

        {auctionEnded && (
          <p className="text-center text-lg text-red-500 font-semibold mt-4">
            Lelang telah berakhir.
          </p>
        )}
      </div>
    </div>
  );
}

export default BidderRoom;
