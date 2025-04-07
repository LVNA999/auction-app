import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue, set } from "firebase/database";

function BidderRoom() {
  const [currentPrice, setCurrentPrice] = useState(0);
  const [status, setStatus] = useState(null);
  const [calls, setCalls] = useState(0);
  const [folds, setFolds] = useState(0);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [bidderId, setBidderId] = useState("");

  useEffect(() => {
    let storedId = localStorage.getItem("bidderId");
    if (!storedId) {
      storedId = prompt("Masukkan nama atau ID kamu untuk bidding:");
      if (storedId) {
        localStorage.setItem("bidderId", storedId);
      } else {
        storedId = "anonymous_" + Math.floor(Math.random() * 10000);
        localStorage.setItem("bidderId", storedId);
      }
    }
    setBidderId(storedId);
  }, []);

  useEffect(() => {
    const priceRef = ref(db, "auction/currentPrice");
    const endRef = ref(db, "auction/ended");

    const unsubPrice = onValue(priceRef, (snapshot) => {
      const val = snapshot.val();
      if (val !== null) setCurrentPrice(val);
    });

    const unsubEnd = onValue(endRef, (snapshot) => {
      const ended = snapshot.val();
      setAuctionEnded(!!ended);
    });

    return () => {
      unsubPrice();
      unsubEnd();
    };
  }, []);

  // Pantau status bidder dari Firebase
  useEffect(() => {
    if (!bidderId) return;

    const bidderRef = ref(db, `auction/bidders/${bidderId}`);
    const unsub = onValue(bidderRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.status) {
        setStatus(data.status);
      }
    });

    return () => unsub();
  }, [bidderId]);

  const submitStatus = (newStatus) => {
    if (!bidderId) return;
    const bidderRef = ref(db, `auction/bidders/${bidderId}`);
    set(bidderRef, {
      status: newStatus,
      timestamp: Date.now(),
    });
  };

  const handleCall = () => {
    setStatus("CALL");
    setCalls((prev) => prev + 1);
    submitStatus("call");
  };

  const handleFold = () => {
    setStatus("FOLD");
    setFolds((prev) => prev + 1);
    submitStatus("fold");
  };

  const hasFolded = status?.toLowerCase() === "fold";

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Bidding Room</h1>

        <p className="text-sm text-gray-500 mb-2">ID Kamu: <strong>{bidderId}</strong></p>

        <div className="mb-4">
          <img
            src="https://via.placeholder.com/300x200.png?text=Barang+Lelang"
            alt="Barang"
            className="rounded"
          />
          <h2 className="text-xl font-semibold mt-2">Nama Barang</h2>
          <p>Deskripsi singkat tentang barang yang dilelang.</p>
        </div>

        <div className="bg-gray-100 p-4 rounded mb-4">
          <p className="text-lg font-medium">Harga saat ini:</p>
          <p className="text-2xl font-bold text-blue-600">
            Rp {currentPrice.toLocaleString()}
          </p>
        </div>

        {!auctionEnded ? (
          <>
            {hasFolded ? (
              <p className="text-yellow-600 font-semibold text-center mb-4">
                Kamu sudah fold. Kamu hanya bisa menonton lelang ini.
              </p>
            ) : (
              <div className="flex space-x-4 mb-4">
                <button
                  className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
                  onClick={handleCall}
                >
                  CALL
                </button>
                <button
                  className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
                  onClick={handleFold}
                >
                  FOLD
                </button>
              </div>
            )}

            {status && (
              <p className="text-center mb-4">
                Kamu memilih:{" "}
                <span className="font-semibold text-indigo-600">{status.toUpperCase()}</span>
              </p>
            )}
          </>
        ) : (
          <p className="text-center text-xl font-bold text-red-500 mb-4">
            Lelang telah berakhir
          </p>
        )}

        <div className="bg-white p-4 rounded border">
          <p className="text-sm text-gray-700">Statistik Lokal (Dummy):</p>
          <p>Jumlah Call: {calls}</p>
          <p>Jumlah Fold: {folds}</p>
        </div>
      </div>
    </div>
  );
}

export default BidderRoom;
