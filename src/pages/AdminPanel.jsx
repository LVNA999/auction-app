// Tambahan import
import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  ref,
  set,
  onValue,
  update,
  get,
  child,
} from "firebase/database";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function AdminPanel() {
  const [tab, setTab] = useState("setup");
  const [adminEmail, setAdminEmail] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imageURL, setImageURL] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [price, setPrice] = useState(0);
  const [increment, setIncrement] = useState(10000);
  const [auctionStarted, setAuctionStarted] = useState(false);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [bidders, setBidders] = useState([]);
  const [canStartTimer, setCanStartTimer] = useState(false);
  const [winner, setWinner] = useState(null);

  const navigate = useNavigate();

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setAdminEmail(user.email);
      else navigate("/admin-login");
    });
    return () => unsub();
  }, []);

  // Load data
  useEffect(() => {
    const guestsRef = ref(db, "auction/guests");
    onValue(guestsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const parsed = Object.entries(data).map(([id, value]) => ({ id, ...value }));
      setBidders(parsed);
    });

    onValue(ref(db, "auction/currentPrice"), (snap) => setPrice(snap.val() || 0));
    onValue(ref(db, "auction/started"), (snap) => setAuctionStarted(snap.val() || false));
    onValue(ref(db, "auction/ended"), (snap) => setAuctionEnded(snap.val() || false));
    onValue(ref(db, "auction/item"), (snap) => {
      const data = snap.val();
      if (data) {
        setItemName(data.name || "");
        setItemDesc(data.description || "");
        setImageURL(data.image || "");
      }
    });

    // Load winner jika sudah diset
    onValue(ref(db, "auction/winner"), (snap) => {
      setWinner(snap.val());
    });
  }, []);

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
    else throw new Error("Gagal upload gambar.");
  };

  const handleStartAuction = async () => {
    if (!imageFile || !itemName || !itemDesc || price <= 0) {
      alert("Lengkapi semua data terlebih dahulu.");
      return;
    }

    const imageUrl = await uploadToCloudinary(imageFile);

    await set(ref(db, "auction"), {
      currentPrice: price,
      started: true,
      ended: false,
      item: { name: itemName, description: itemDesc, image: imageUrl },
    });

    const snapshot = await get(child(ref(db), "auction/guests"));
    if (snapshot.exists()) {
      const data = snapshot.val();
      for (let id in data) {
        if (data[id].verified && data[id].active) {
          update(ref(db, `auction/guests/${id}`), {
            status: "waiting",
          });
        }
      }
    }

    setCanStartTimer(true);
    alert("Lelang dimulai!");
  };

  const increasePrice = () => {
    const newPrice = price + increment;
    setPrice(newPrice);
    set(ref(db, "auction/currentPrice"), newPrice);
    setCanStartTimer(true);
  };

  const handleStartTimer = () => {
    const endTime = Date.now() + 30000;
    set(ref(db, "auction/timerEnd"), endTime);
    setCanStartTimer(false);
  };

  const endAuction = async () => {
    await set(ref(db, "auction/ended"), true);
    await set(ref(db, "auction/started"), false);

    // Cari pemenang
    const lastCaller = bidders.findLast((b) => b.status === "call");
    if (lastCaller) {
      await set(ref(db, "auction/winner"), {
        name: lastCaller.name,
        email: lastCaller.email || "-",
        id: lastCaller.id,
      });
      setWinner(lastCaller);
    } else {
      await set(ref(db, "auction/winner"), null);
      setWinner(null);
    }
  };

  const verifyBidder = (id) => {
    update(ref(db, `auction/guests/${id}`), {
      verified: true,
      active: true,
      status: "waiting",
    });
  };

  const toggleBidderActive = (id, active) => {
    update(ref(db, `auction/guests/${id}`), {
      active: !active,
    });
  };

  const logout = async () => {
    await signOut(auth);
    navigate("/admin-login");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded shadow">
        <div className="flex justify-between mb-4">
          <p>Login sebagai: <strong>{adminEmail}</strong></p>
          <button onClick={logout} className="bg-red-500 text-white px-4 py-1 rounded">Logout</button>
        </div>

        <div className="flex gap-4 mb-6">
          <button onClick={() => setTab("setup")} disabled={auctionStarted}
            className={`px-4 py-2 rounded ${tab === "setup" ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
            Setup Lelang
          </button>
          <button onClick={() => setTab("monitor")} disabled={!auctionStarted}
            className={`px-4 py-2 rounded ${tab === "monitor" ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
            Monitoring
          </button>
          <button onClick={() => setTab("verify")}
            className={`px-4 py-2 rounded ${tab === "verify" ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
            Verifikasi Peserta
          </button>
        </div>

        {tab === "setup" && (
          <div>
            {imageURL && <img src={imageURL} alt="Item" className="mb-4 rounded max-h-60" />}
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="mb-2" />
            <input type="text" value={itemName} placeholder="Nama Barang"
              onChange={(e) => setItemName(e.target.value)} className="w-full border p-2 mb-2 rounded" />
            <textarea value={itemDesc} placeholder="Deskripsi"
              onChange={(e) => setItemDesc(e.target.value)} className="w-full border p-2 mb-2 rounded" />
            <input type="number" value={price} placeholder="Harga Awal"
              onChange={(e) => setPrice(Number(e.target.value))} className="w-full border p-2 mb-2 rounded" />
            <input type="number" value={increment} placeholder="Kelipatan"
              onChange={(e) => setIncrement(Number(e.target.value))} className="w-full border p-2 mb-4 rounded" />
            <button onClick={handleStartAuction} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Mulai Lelang</button>
          </div>
        )}

        {tab === "monitor" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Monitoring Lelang</h2>
            <div className="bg-gray-100 p-4 rounded mb-4">
              <img src={imageURL} alt="Item" className="rounded mb-4 max-h-60 mx-auto" />
              <h3 className="text-lg font-bold">{itemName}</h3>
              <p className="mb-2">{itemDesc}</p>
              <p className="text-2xl font-bold text-blue-600">Rp {price.toLocaleString()}</p>
            </div>

            <div className="flex gap-4 mb-4">
              <button onClick={increasePrice} className="bg-blue-600 text-white px-4 py-2 rounded">Naikkan Harga</button>
              <button onClick={handleStartTimer} disabled={!canStartTimer}
                className={`px-4 py-2 rounded text-white ${canStartTimer ? "bg-yellow-500" : "bg-gray-400"}`}>
                Mulai Timer
              </button>
              <button onClick={endAuction} className="bg-red-600 text-white px-4 py-2 rounded">Akhiri Lelang</button>
            </div>

            <h4 className="font-semibold mt-6 mb-2">Daftar CALL</h4>
            <ul>{bidders.filter(b => b.status === "call").map(b => <li key={b.id}>✅ {b.name}</li>)}</ul>

            <h4 className="font-semibold mt-4 mb-2">Daftar FOLD</h4>
            <ul>{bidders.filter(b => b.status === "fold").map(b => <li key={b.id}>❌ {b.name}</li>)}</ul>

            {auctionEnded && winner && (
              <div className="mt-6 p-4 bg-green-100 border border-green-400 rounded">
                <h3 className="text-lg font-bold text-green-700">🎉 Pemenang:</h3>
                <p>Nama: <strong>{winner.name}</strong></p>
                <p>Email: <strong>{winner.email}</strong></p>
              </div>
            )}
          </div>
        )}

        {tab === "verify" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Verifikasi Peserta</h2>
            {bidders.map((b) => (
              <div key={b.id} className="flex justify-between items-center bg-gray-100 p-3 rounded mb-2">
                <div>
                  <p className="font-medium">{b.name} {b.verified ? "(✔ Terverifikasi)" : "(❌ Belum)"}</p>
                  <p className="text-sm text-gray-600">Status: {b.active ? "Aktif" : "Nonaktif"}</p>
                </div>
                <div className="flex gap-2">
                  {!b.verified ? (
                    <button onClick={() => verifyBidder(b.id)} className="bg-green-500 text-white px-3 py-1 rounded">Verifikasi</button>
                  ) : (
                    <button onClick={() => toggleBidderActive(b.id, b.active)}
                      className={`text-white px-3 py-1 rounded ${b.active ? "bg-yellow-500" : "bg-blue-500"}`}>
                      {b.active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
