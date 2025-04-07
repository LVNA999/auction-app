import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, set, onValue, update } from "firebase/database";

function AdminPanel() {
  const [price, setPrice] = useState(100000);
  const [increment, setIncrement] = useState(10000);
  const [binPrice, setBinPrice] = useState(500000);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [bidders, setBidders] = useState([]);

  // Ambil data bidder realtime
  useEffect(() => {
    const bidderRef = ref(db, "auction/bidders");
    const unsub = onValue(bidderRef, (snapshot) => {
      const data = snapshot.val() || {};
      const parsed = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
      }));
      setBidders(parsed);
    });

    const priceRef = ref(db, "auction/currentPrice");
    const unsubPrice = onValue(priceRef, (snap) => {
      const p = snap.val();
      if (p) setPrice(p);
    });

    const endedRef = ref(db, "auction/ended");
    const unsubEnded = onValue(endedRef, (snap) => {
      const ended = snap.val();
      if (ended) setAuctionEnded(true);
    });

    return () => {
      unsub();
      unsubPrice();
      unsubEnded();
    };
  }, []);

  // Fungsi menaikkan harga
  const increasePrice = () => {
    const newPrice = price + increment;
    setPrice(newPrice);
    set(ref(db, "auction/currentPrice"), newPrice);

    if (newPrice >= binPrice) {
      setAuctionEnded(true);
      set(ref(db, "auction/ended"), true);
    }
  };

  const endAuction = () => {
    setAuctionEnded(true);
    set(ref(db, "auction/ended"), true);
  };

  const verifyBidder = (id) => {
    update(ref(db, `auction/bidders/${id}`), {
      verified: true,
      status: "waiting",
    });
  };

  const countStatus = (status) => {
    return bidders.filter((b) => b.status === status).length;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* === Panel Lelang === */}
          <div>
            <img
              src="https://via.placeholder.com/300x200.png?text=Barang+Lelang"
              alt="Barang"
              className="rounded mb-4"
            />

            <h2 className="text-xl font-semibold mb-2">Nama Barang</h2>
            <p className="mb-4">Deskripsi singkat tentang barang yang dilelang.</p>

            <div className="bg-gray-100 p-4 rounded mb-4">
              <p className="text-lg font-medium">Harga Saat Ini:</p>
              <p className="text-2xl font-bold text-blue-600">
                Rp {price.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                BIN: Rp {binPrice.toLocaleString()}
              </p>
            </div>

            <label className="block mb-1 font-medium">Kelipatan Harga</label>
            <input
              type="number"
              min={1000}
              step={1000}
              value={increment}
              onChange={(e) => setIncrement(Number(e.target.value))}
              className="w-full border p-2 mb-4 rounded"
            />

            <div className="flex space-x-4 mb-4">
              <button
                onClick={increasePrice}
                disabled={auctionEnded}
                className={`px-6 py-2 rounded ${
                  auctionEnded
                    ? "bg-gray-400"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                Naikkan Harga
              </button>
              <button
                onClick={endAuction}
                disabled={auctionEnded}
                className="px-6 py-2 rounded bg-red-500 text-white hover:bg-red-600"
              >
                Akhiri Lelang
              </button>
            </div>

            <div className="bg-white border p-4 rounded">
              <p className="font-medium">Status Bidder:</p>
              <p>Jumlah Call: {countStatus("call")}</p>
              <p>Jumlah Fold: {countStatus("fold")}</p>

              {/* Daftar CALL */}
              <div className="mt-4">
                <p className="font-semibold">Daftar Bidder yang CALL:</p>
                {bidders.filter((b) => b.status === "call").length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Belum ada bidder yang CALL.
                  </p>
                ) : (
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {bidders
                      .filter((b) => b.status === "call")
                      .map((b) => (
                        <li key={b.id}>{b.name}</li>
                      ))}
                  </ul>
                )}
              </div>
            </div>

            {auctionEnded && (
              <p className="text-center text-red-500 font-bold text-lg mt-4">
                Lelang Telah Berakhir
              </p>
            )}
          </div>

          {/* === Panel Verifikasi === */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Verifikasi Guest</h2>
            {bidders.filter((b) => !b.verified).length === 0 ? (
              <p className="text-sm text-gray-600">Tidak ada guest yang menunggu.</p>
            ) : (
              <ul className="space-y-2">
                {bidders
                  .filter((b) => !b.verified)
                  .map((b) => (
                    <li
                      key={b.id}
                      className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded"
                    >
                      <span>{b.name}</span>
                      <button
                        onClick={() => verifyBidder(b.id)}
                        className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
                      >
                        Verifikasi
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
