import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { ref, set } from "firebase/database";

function GuestForm() {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const guestId = `guest_${Date.now()}`;
    localStorage.setItem("guestId", guestId);
    localStorage.setItem("guestName", name);

    // Simpan ke database di path 'guests'
    await set(ref(db, `auction/guests/${guestId}`), {
      name,
      status: "pending", // akan diverifikasi oleh admin
    });

    alert("Pendaftaran berhasil. Menunggu verifikasi admin.");
    navigate("/waiting-room");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow w-96"
      >
        <h1 className="text-2xl font-bold mb-4 text-center">
          Daftar Sebagai Guest
        </h1>
        <input
          type="text"
          placeholder="Nama kamu"
          className="w-full border p-2 mb-4 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Daftar
        </button>
      </form>
    </div>
  );
}

export default GuestForm;
