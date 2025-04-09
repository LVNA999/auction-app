import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { ref, onValue, update } from "firebase/database";

function WaitingRoom() {
  const navigate = useNavigate();
  const guestId = localStorage.getItem("guestId");
  const [guestName, setGuestName] = useState("");
  const [inputName, setInputName] = useState("");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!guestId) {
      navigate("/guest-login");
      return;
    }

    const guestRef = ref(db, `auction/guests/${guestId}`);
    const unsub = onValue(guestRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setStatus("not found");
        return;
      }

      const isVerified = data.verified;
      const isActive = data.active;
      const name = data.name || "";
      setGuestName(name);
      setInputName(name);
      setStatus(isVerified ? "verified" : "pending");

      if (isVerified && isActive) {
        localStorage.setItem("bidderId", guestId);
        navigate("/bidder-room");
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

    alert("Profil diperbarui. Menunggu verifikasi dari admin.");
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center bg-white px-8 py-6 rounded shadow max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Profil Kamu</h1>

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

        {status === "pending" && (
          <>
            <p className="text-gray-700 mb-1">Status: <strong>Pending Verifikasi</strong></p>
            <p className="text-sm text-orange-500">
              Mohon tunggu, admin akan segera memverifikasi akun kamu.
            </p>
          </>
        )}

        {status === "not found" && (
          <p className="text-sm text-red-500">
            Akun tidak ditemukan. Silakan login ulang.
          </p>
        )}
      </div>
    </div>
  );
}

export default WaitingRoom;
