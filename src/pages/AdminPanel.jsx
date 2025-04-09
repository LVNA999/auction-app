import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { ref, set, onValue, update } from "firebase/database";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function AdminPanel() {
  const [price, setPrice] = useState(0);
  const [increment, setIncrement] = useState(10000);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [bidders, setBidders] = useState([]);
  const [adminEmail, setAdminEmail] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [imageURL, setImageURL] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [auctionStarted, setAuctionStarted] = useState(false);
  const [canStartTimer, setCanStartTimer] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setAdminEmail(user.email);
      else navigate("/admin-login");
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const guestsRef = ref(db, "auction/guests");
    const unsubGuests = onValue(guestsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const parsed = Object.entries(data).map(([id, value]) => ({ id, ...value }));
      setBidders(parsed);
    });

    const priceRef = ref(db, "auction/currentPrice");
    const endedRef = ref(db, "auction/ended");
    const startedRef = ref(db, "auction/started");
    const itemRef = ref(db, "auction/item");

    const unsubPrice = onValue(priceRef, (snap) => setPrice(snap.val() || 0));
    const unsubEnded = onValue(endedRef, (snap) => setAuctionEnded(snap.val() || false));
    const unsubStarted = onValue(startedRef, (snap) => setAuctionStarted(snap.val() || false));
    const unsubItem = onValue(itemRef, (snap) => {
      const data = snap.val();
      if (data) {
        setItemName(data.name || "");
        setItemDesc(data.description || "");
        setImageURL(data.image || "");
      }
    });

    return () => {
      unsubGuests();
      unsubPrice();
      unsubEnded();
      unsubStarted();
      unsubItem();
    };
  }, []);

  const increasePrice = async () => {
    const newPrice = price + increment;
    setPrice(newPrice);
    await set(ref(db, "auction/currentPrice"), newPrice);
    setCanStartTimer(true);
  };

  const startTimer = async () => {
    const endTime = Date.now() + 30000; // 30 detik
    await set(ref(db, "auction/timerEnd"), endTime);
    setCanStartTimer(false);
  };

  const endAuction = async () => {
    await set(ref(db, "auction/ended"), true);
    await set(ref(db, "auction/started"), false);
    setAuctionEnded(true);
    setAuctionStarted(false);
  };

  const verifyBidder = (id) => {
    update(ref(db, `auction/guests/${id}`), {
      verified: true,
      status: "waiting",
      active: true,
    });
  };

  const toggleBidderActive = (id, currentStatus) => {
    update(ref(db, `auction/guests/${id}`), {
      active: !currentStatus,
    });
  };

  const resetAllStatuses = async () => {
    const updates = {};
    bidders.forEach((b) => {
      updates[`auction/guests/${b.id}/status`] = "waiting";
    });
    await update(ref(db), updates);
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "upload_preset");

    const res = await fetch("https://api.cloudinary.com/v1_1/dex2qqidi/image/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.secure_url) return data.secure_url;
    else throw new Error("Upload ke Cloudinary gagal.");
  };

  const handleStartAuction = async () => {
    if (!imageFile || !itemName || !itemDesc || price <= 0 || increment <= 0) {
      alert("Lengkapi semua data terlebih dahulu.");
      return;
    }

    try {
      const imageUrl = await uploadToCloudinary(imageFile);
      await set(ref(db, "auction/currentPrice"), price);
      await set(ref(db, "auction/started"), true);
      await set(ref(db, "auction/ended"), false);
      await set(ref(db, "auction/item"), {
        name: itemName,
        description: itemDesc,
        image: imageUrl,
      });
      await resetAllStatuses();

      setImageURL(imageUrl);
      setAuctionStarted(true);
      setCanStartTimer(true);
      alert("Lelang dimulai!");
    } catch (err) {
      console.error(err);
      alert("Gagal upload gambar. Coba lagi.");
    }
  };

  const countStatus = (status) => bidders.filter((b) => b.status === status).length;

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/admin-login");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-600">
            Login sebagai: <strong>{adminEmail}</strong>
          </p>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded"
          >
            Logout
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* === Panel Barang dan Kontrol === */}
          <div>
            {imageURL ? (
              <img src={imageURL} alt="Barang" className="rounded mb-4" />
            ) : (
              <div className="h-40 bg-gray-200 rounded mb-4 flex items-center justify-center">
                <span className="text-gray-400">Belum ada gambar</span>
              </div>
            )}

            {!auctionStarted && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="mb-3"
                />
                <input
                  type="text"
                  placeholder="Nama Barang"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full border p-2 mb-2 rounded"
                />
                <textarea
                  placeholder="Deskripsi"
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full border p-2 mb-2 rounded"
                />
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  placeholder="Harga Awal"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full border p-2 mb-2 rounded"
                />
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  placeholder="Kelipatan Harga"
                  value={increment}
                  onChange={(e) => setIncrement(Number(e.target.value))}
                  className="w-full border p-2 mb-4 rounded"
                />
                <button
                  onClick={handleStartAuction}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mb-4"
                >
                  Mulai Lelang
                </button>
              </>
            )}

            <div className="bg-gray-100 p-4 rounded mb-4">
              <p className="text-lg font-medium">Harga Saat Ini:</p>
              <p className="text-2xl font-bold text-blue-600">
                Rp {price.toLocaleString()}
              </p>
            </div>

            {auctionStarted && (
              <>
                <div className="flex space-x-4 mb-4">
                  <button
                    onClick={increasePrice}
                    disabled={auctionEnded}
                    className="px-6 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Naikkan Harga
                  </button>
                  <button
                    onClick={startTimer}
                    disabled={!canStartTimer || auctionEnded}
                    className="px-6 py-2 rounded bg-indigo-500 hover:bg-indigo-600 text-white"
                  >
                    Mulai Timer (30s)
                  </button>
                  <button
                    onClick={endAuction}
                    disabled={auctionEnded}
                    className="px-6 py-2 rounded bg-red-500 hover:bg-red-600 text-white"
                  >
                    Akhiri Lelang
                  </button>
                </div>
                {auctionEnded && (
                  <p className="text-center text-red-500 font-bold text-lg mt-4">
                    Lelang Telah Berakhir
                  </p>
                )}
              </>
            )}
          </div>

          {/* === Panel Verifikasi dan Manajemen === */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Manajemen Bidder</h2>
            {bidders.length === 0 ? (
              <p className="text-sm text-gray-600">Belum ada pendaftar.</p>
            ) : (
              <ul className="space-y-3">
                {bidders.map((b) => (
                  <li
                    key={b.id}
                    className="bg-gray-100 px-4 py-2 rounded flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">
                        {b.name} {b.verified ? "(Terverifikasi)" : "(Pending)"}
                      </p>
                      {b.verified && (
                        <p className="text-sm text-gray-600">
                          Status: {b.active ? "Aktif" : "Nonaktif"}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!b.verified ? (
                        <button
                          onClick={() => verifyBidder(b.id)}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        >
                          Verifikasi
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleBidderActive(b.id, b.active)}
                          className={`px-3 py-1 rounded text-white ${
                            b.active
                              ? "bg-yellow-500 hover:bg-yellow-600"
                              : "bg-blue-500 hover:bg-blue-600"
                          }`}
                        >
                          {b.active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6">
              <p className="font-medium">Status Bidder:</p>
              <p>Jumlah Call: {countStatus("call")}</p>
              <p>Jumlah Fold: {countStatus("fold")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
