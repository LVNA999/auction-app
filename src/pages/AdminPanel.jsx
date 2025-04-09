import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  ref,
  set,
  onValue,
  update,
} from "firebase/database";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function AdminPanel() {
  const [tab, setTab] = useState("verifikasi");
  const [adminEmail, setAdminEmail] = useState("");
  const [price, setPrice] = useState(0);
  const [increment, setIncrement] = useState(10000);
  const [auctionStarted, setAuctionStarted] = useState(false);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [bidders, setBidders] = useState([]);
  const [timerRunning, setTimerRunning] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setAdminEmail(user.email);
      else navigate("/admin-login");
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubGuests = onValue(ref(db, "auction/guests"), (snapshot) => {
      const data = snapshot.val() || {};
      const parsed = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      setBidders(parsed);
    });

    const unsubAuction = onValue(ref(db, "auction"), (snapshot) => {
      const data = snapshot.val() || {};
      setPrice(data.currentPrice || 0);
      setAuctionStarted(data.started || false);
      setAuctionEnded(data.ended || false);
      if (data.item) {
        setItemName(data.item.name || "");
        setItemDesc(data.item.description || "");
        setImageURL(data.item.image || "");
      }
    });

    const unsubTimer = onValue(ref(db, "auction/timer"), (snapshot) => {
      setTimerRunning(snapshot.val() || false);
    });

    return () => {
      unsubGuests();
      unsubAuction();
      unsubTimer();
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/admin-login");
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
    throw new Error("Upload gagal");
  };

  const handleStartAuction = async () => {
    if (!itemName || !itemDesc || !imageFile || price <= 0) {
      alert("Lengkapi semua data lelang terlebih dahulu");
      return;
    }

    try {
      const imageUrl = await uploadToCloudinary(imageFile);

      // reset status call/fold semua peserta
      const updates = {};
      bidders.forEach((b) => {
        updates[`auction/guests/${b.id}/status`] = "waiting";
      });
      await update(ref(db), updates);

      await set(ref(db, "auction"), {
        currentPrice: price,
        started: true,
        ended: false,
        item: {
          name: itemName,
          description: itemDesc,
          image: imageUrl,
        },
      });

      alert("Lelang dimulai!");
    } catch (err) {
      alert("Gagal memulai lelang");
    }
  };

  const increasePrice = () => {
    const newPrice = price + increment;
    set(ref(db, "auction/currentPrice"), newPrice);
    set(ref(db, "auction/timer"), false);

    // diskualifikasi bidder yang belum CALL
    bidders.forEach((b) => {
      if (b.status !== "call") {
        update(ref(db, `auction/guests/${b.id}`), {
          status: "fold",
        });
      }
    });
  };

  const endAuction = () => {
    set(ref(db, "auction/ended"), true);
    set(ref(db, "auction/started"), false);
    set(ref(db, "auction/timer"), false);
  };

  const startTimer = () => {
    set(ref(db, "auction/timer"), true);
  };

  const verifyBidder = (id) => {
    update(ref(db, `auction/guests/${id}`), {
      verified: true,
      active: true,
      status: "waiting",
    });
  };

  const toggleTab = (name) => {
    if (name === "setup" && auctionStarted) return;
    if (name === "monitoring" && !auctionStarted) return;
    setTab(name);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm">Login sebagai: <strong>{adminEmail}</strong></p>
          <button onClick={handleLogout} className="bg-red-500 px-4 py-1 text-white rounded">
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button onClick={() => toggleTab("setup")} disabled={auctionStarted} className={`px-4 py-2 rounded ${tab === "setup" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
            Setup Lelang
          </button>
          <button onClick={() => toggleTab("monitoring")} disabled={!auctionStarted} className={`px-4 py-2 rounded ${tab === "monitoring" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
            Monitoring Lelang
          </button>
          <button onClick={() => toggleTab("verifikasi")} className={`px-4 py-2 rounded ${tab === "verifikasi" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
            Verifikasi Peserta
          </button>
        </div>

        {/* Content */}
        {tab === "setup" && (
          <div>
            <div className="mb-4">
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="mb-2" />
              <input type="text" placeholder="Nama Barang" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full border p-2 mb-2 rounded" />
              <textarea placeholder="Deskripsi" value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} className="w-full border p-2 mb-2 rounded" />
              <input type="number" min={0} placeholder="Harga Awal" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full border p-2 mb-2 rounded" />
              <input type="number" min={0} placeholder="Kelipatan Harga" value={increment} onChange={(e) => setIncrement(Number(e.target.value))} className="w-full border p-2 mb-4 rounded" />
              <button onClick={handleStartAuction} className="bg-green-600 text-white px-4 py-2 rounded">Mulai Lelang</button>
            </div>
          </div>
        )}

        {tab === "monitoring" && (
          <div>
            <div className="mb-4">
              <img src={imageURL} alt="Barang" className="rounded mb-4 max-h-64" />
              <h2 className="text-xl font-bold">{itemName}</h2>
              <p className="text-gray-700 mb-2">{itemDesc}</p>
              <p className="text-xl font-bold text-blue-600 mb-4">Harga Saat Ini: Rp {price.toLocaleString()}</p>

              <div className="flex space-x-4 mb-4">
                <button onClick={increasePrice} disabled={auctionEnded} className="bg-blue-500 text-white px-4 py-2 rounded">Naikkan Harga</button>
                <button onClick={startTimer} disabled={timerRunning || auctionEnded} className="bg-yellow-500 text-white px-4 py-2 rounded">Mulai Timer</button>
                <button onClick={endAuction} disabled={auctionEnded} className="bg-red-500 text-white px-4 py-2 rounded">Akhiri Lelang</button>
              </div>

              <h3 className="text-lg font-semibold mt-6 mb-2">Daftar Bidder:</h3>
              <ul>
                {bidders.map((b) => (
                  <li key={b.id} className="mb-1">
                    {b.name} - {b.status?.toUpperCase()}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === "verifikasi" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Verifikasi Peserta</h2>
            <ul className="space-y-3">
              {bidders.map((b) => (
                <li key={b.id} className="bg-gray-100 px-4 py-2 rounded flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {b.name} {b.verified ? "(Terverifikasi)" : "(Pending)"}
                    </p>
                  </div>
                  {!b.verified && (
                    <button
                      onClick={() => verifyBidder(b.id)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      Verifikasi
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
