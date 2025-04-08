import { useEffect, useState } from "react";
import { db, auth, storage } from "../firebase";
import {
  ref,
  set,
  onValue,
  update,
} from "firebase/database";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function AdminPanel() {
  const [price, setPrice] = useState(0);
  const [increment, setIncrement] = useState(10000);
  const [binPrice, setBinPrice] = useState(500000);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [bidders, setBidders] = useState([]);
  const [adminEmail, setAdminEmail] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [imageURL, setImageURL] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [auctionStarted, setAuctionStarted] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAdminEmail(user.email);
      } else {
        navigate("/admin-login");
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const guestsRef = ref(db, "auction/guests");
    const unsub = onValue(guestsRef, (snapshot) => {
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
      setAuctionEnded(snap.val() || false);
    });

    const startedRef = ref(db, "auction/started");
    const unsubStarted = onValue(startedRef, (snap) => {
      setAuctionStarted(snap.val() || false);
    });

    const itemRef = ref(db, "auction/item");
    onValue(itemRef, (snap) => {
      const data = snap.val();
      if (data) {
        setItemName(data.name || "");
        setItemDesc(data.description || "");
        setImageURL(data.image || "");
      }
    });

    return () => {
      unsub();
      unsubPrice();
      unsubEnded();
      unsubStarted();
    };
  }, []);

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
    setAuctionStarted(false);
    set(ref(db, "auction/ended"), true);
    set(ref(db, "auction/started"), false);
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

  const handleStartAuction = async () => {
    if (!imageFile || !itemName || !itemDesc || price <= 0) {
      alert("Lengkapi semua data terlebih dahulu.");
      return;
    }

    const imgRef = storageRef(storage, `items/${Date.now()}-${imageFile.name}`);
    await uploadBytes(imgRef, imageFile);
    const downloadURL = await getDownloadURL(imgRef);

    await set(ref(db, "auction/currentPrice"), price);
    await set(ref(db, "auction/started"), true);
    await set(ref(db, "auction/ended"), false);
    await set(ref(db, "auction/item"), {
      name: itemName,
      description: itemDesc,
      image: downloadURL,
    });

    setImageURL(downloadURL);
    setAuctionStarted(true);
    alert("Lelang dimulai!");
  };

  const countStatus = (status) => {
    return bidders.filter((b) => b.status === status).length;
  };

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

        {/* === Bagian Barang dan Kontrol === */}
        <div className="grid md:grid-cols-2 gap-6">
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
              disabled={!auctionStarted || auctionEnded}
            />

            <div className="flex space-x-4 mb-4">
              <button
                onClick={increasePrice}
                disabled={!auctionStarted || auctionEnded}
                className={`px-6 py-2 rounded ${
                  auctionEnded || !auctionStarted
                    ? "bg-gray-400"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                Naikkan Harga
              </button>
              <button
                onClick={endAuction}
                disabled={!auctionStarted || auctionEnded}
                className="px-6 py-2 rounded bg-red-500 text-white hover:bg-red-600"
              >
                Akhiri Lelang
              </button>
            </div>

            {auctionEnded && (
              <p className="text-center text-red-500 font-bold text-lg mt-4">
                Lelang Telah Berakhir
              </p>
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
