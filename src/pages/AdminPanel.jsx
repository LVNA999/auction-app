import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ref,
  set,
  get,
  update,
  onValue,
  child,
} from "firebase/database";
import { auth, db } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";

function AdminPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("setup");
  const [adminEmail, setAdminEmail] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [imageFiles, setImageFiles] = useState([]);
  const [imageURLs, setImageURLs] = useState([]);
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [price, setPrice] = useState(0);
  const [increment, setIncrement] = useState(10000);
  const [auctionStarted, setAuctionStarted] = useState(false);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [canStartTimer, setCanStartTimer] = useState(false);
  const [bidders, setBidders] = useState([]);
  const [winner, setWinner] = useState(null);

  // Autentikasi dan otorisasi admin
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAdminEmail(user.email);
        const adminRef = ref(db, `admins/${user.uid}`);
        const snap = await get(adminRef);
        if (snap.exists()) {
          setIsAuthorized(true);
        } else {
          alert("Akun ini tidak memiliki akses admin.");
          await signOut(auth);
          navigate("/admin-login");
        }
      } else {
        navigate("/admin-login");
      }
    });

    return () => unsub();
  }, [navigate]);

  // Sinkronisasi data realtime dari Firebase
  useEffect(() => {
    const unsubGuests = onValue(ref(db, "auction/guests"), (snap) => {
      const data = snap.val() || {};
      const parsed = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      setBidders(parsed);
    });

    const unsubPrice = onValue(ref(db, "auction/currentPrice"), (snap) => {
      const val = snap.val();
      if (val) setPrice(val);
    });

    const unsubStarted = onValue(ref(db, "auction/started"), (snap) => {
      setAuctionStarted(!!snap.val());
    });

    const unsubEnded = onValue(ref(db, "auction/ended"), (snap) => {
      setAuctionEnded(!!snap.val());
    });

    const unsubItem = onValue(ref(db, "auction/item"), (snap) => {
      const data = snap.val();
      if (data) {
        setItemName(data.name || "");
        setItemDesc(data.description || "");
        setImageURLs(data.images || []);
      }
    });

    const unsubCanStartTimer = onValue(ref(db, "auction/canStartTimer"), (snap) => {
      setCanStartTimer(!!snap.val());
    });

    const unsubWinner = onValue(ref(db, "auction/winner"), (snap) => {
      setWinner(snap.val() || null);
    });

    return () => {
      unsubGuests();
      unsubPrice();
      unsubStarted();
      unsubEnded();
      unsubItem();
      unsubCanStartTimer();
      unsubWinner();
    };
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
    return data.secure_url;
  };

  const handleStartAuction = async () => {
    if (imageFiles.length === 0 || !itemName || !itemDesc || price <= 0) {
      alert("Lengkapi semua data terlebih dahulu.");
      return;
    }

    const uploadedURLs = await Promise.all(
      imageFiles.map((file) => uploadToCloudinary(file))
    );

    await set(ref(db, "auction"), {
      currentPrice: price,
      started: true,
      ended: false,
      canStartTimer: true,
      item: {
        name: itemName,
        description: itemDesc,
        images: uploadedURLs,
      },
    });

    const snap = await get(child(ref(db), "auction/guests"));
    if (snap.exists()) {
      const data = snap.val();
      for (let id in data) {
        if (data[id].verified && data[id].active) {
          update(ref(db, `auction/guests/${id}`), {
            status: "waiting",
          });
        }
      }
    }

    alert("Lelang dimulai!");
  };

  const increasePrice = async () => {
    const newPrice = price + increment;
    await set(ref(db, "auction/currentPrice"), newPrice);
    await set(ref(db, "auction/canStartTimer"), true);
  };

  const handleStartTimer = async () => {
    const end = Date.now() + 30000;
    await set(ref(db, "auction/timerEnd"), end);
    await set(ref(db, "auction/canStartTimer"), false);
  };

  const endAuction = async () => {
    const confirmEnd = window.confirm("Yakin ingin mengakhiri lelang?");
    if (!confirmEnd) return;

    await set(ref(db, "auction/ended"), true);
    await set(ref(db, "auction/started"), false);
    await set(ref(db, "auction/canStartTimer"), false);

    const lastCaller = [...bidders].reverse().find((b) => b.status === "call");
    if (lastCaller) {
      await set(ref(db, "auction/winner"), {
        name: lastCaller.name,
        email: lastCaller.email || "-",
        id: lastCaller.id,
        price,
      });
    } else {
      await set(ref(db, "auction/winner"), null);
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
    update(ref(db, `auction/guests/${id}`), { active: !active });
  };

  const logout = async () => {
    await signOut(auth);
    navigate("/admin-login");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-600">
            Login sebagai: <strong>{adminEmail}</strong>
          </p>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-1 rounded"
          >
            Logout
          </button>
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
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImageFiles(Array.from(e.target.files))}
              className="mb-2"
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
              placeholder="Harga Awal"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full border p-2 mb-2 rounded"
            />
            <input
              type="number"
              placeholder="Kelipatan"
              value={increment}
              onChange={(e) => setIncrement(Number(e.target.value))}
              className="w-full border p-2 mb-4 rounded"
            />
            <button
              onClick={handleStartAuction}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Mulai Lelang
            </button>
          </div>
        )}

        {tab === "monitor" && (
          <div>
            <div className="mb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {imageURLs.map((url, idx) => (
                  <img key={idx} src={url} alt={`Item ${idx + 1}`} className="rounded max-h-40 object-cover w-full" />
                ))}
              </div>
              <h2 className="text-xl font-semibold">{itemName}</h2>
              <p>{itemDesc}</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                Rp {price.toLocaleString()}
              </p>
            </div>

            <div className="flex gap-4 mb-4">
              <button onClick={increasePrice} className="bg-blue-600 text-white px-4 py-2 rounded">Naikkan Harga</button>
              <button onClick={handleStartTimer} disabled={!canStartTimer}
                className={`text-white px-4 py-2 rounded ${canStartTimer ? "bg-yellow-500" : "bg-gray-400"}`}>
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
                <p>Harga: <strong>Rp {winner.price.toLocaleString()}</strong></p>
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
                  <p className="font-medium">{b.name} {b.verified ? "(✔)" : "(❌)"}</p>
                  <p className="text-sm text-gray-600">Status: {b.active ? "Aktif" : "Nonaktif"}</p>
                </div>
                <div className="flex gap-2">
                  {!b.verified && (
                    <button onClick={() => verifyBidder(b.id)} className="bg-green-500 text-white px-3 py-1 rounded">
                      Verifikasi
                    </button>
                  )}
                  {b.verified && (
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
