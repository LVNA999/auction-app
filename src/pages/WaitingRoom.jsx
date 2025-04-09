import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { ref, onValue, update } from "firebase/database";

function WaitingRoom() {
  const navigate = useNavigate();
  const guestId = localStorage.getItem("guestId");
  const [guestData, setGuestData] = useState(null);
  const [inputName, setInputName] = useState("");
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  useEffect(() => {
    if (!guestId) {
      navigate("/guest-login");
      return;
    }

    const guestRef = ref(db, `auction/guests/${guestId}`);
    const unsub = onValue(guestRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setGuestData({ status: "not found" });
        return;
      }

      setGuestData(data);
      setInputName(data.name || "");

      const isVerified = data.verified;
      const isActive = data.active;

      // Jika sudah diverifikasi dan aktif, langsung masuk ke BidderRoom
      if (isVerified && isActive) {
        localStorage.setItem("bidderId", guestId);
        navigate("/bidder-room");
      }

      // Tandai kalau user sudah pernah submit form
      if (!data.verified && data.status === "waiting") {
        setIsFormSubmitted(true);
      }
    });

    return () => unsub();
  }, [guestId, navigate]);

  const handleSave = async () => {
    if (!inputName.trim()) {
      alert("Nama tidak boleh kosong.");
      return;
    }

    await update(ref(db, `auction/guests/${guestId}`), {
      name: inputName.trim(),
      verified: false,
      status: "waiting",
    });

    setIsFormSubmitted(true); // hide form setelah klik
    alert("Profil diperbarui. Menunggu verifikasi dari admin.");
  };

  if (!guestData) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-gray-600">Memuat data akun...</p>
      </div>
    );
  }

  if (guestData.status === "not found") {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="bg-white p-6 rounded shadow text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Akun Tidak Ditemukan</h2>
          <p>Silakan login ulang.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center bg-white px-8 py-6 rounded shadow max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Profil Kamu</h1>

        {!isFormSubmitted && (
          <>
            <input
              type="text"
              placeholder="Nama Lengkap"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="w-full border p-2 rounded mb-4"
            />

            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
            >
              Simpan & Minta Verifikasi
            </button>

            <hr className="my-6 border-gray-300" />
          </>
        )}

        {guestData.verified === false && (
          <>
            <p className="text-gray-700 mb-1">
              Status: <strong>Pending Verifikasi</strong>
            </p>
            <p className="text-sm text-orange-500">
              Mohon tunggu, admin akan segera memverifikasi akun kamu.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default WaitingRoom;
