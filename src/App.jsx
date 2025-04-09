// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import GuestLogin from "./pages/GuestLogin";
import WaitingRoom from "./pages/WaitingRoom";
import BidderRoom from "./pages/BidderRoom";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect ke guest login sebagai default */}
        <Route path="/" element={<Navigate to="/guest-login" />} />

        {/* Route untuk bidder/guest */}
        <Route path="/guest-login" element={<GuestLogin />} />
        <Route path="/waiting-room" element={<WaitingRoom />} />
        <Route path="/bidder-room" element={<BidderRoom />} />

        {/* Login admin */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Halaman admin yang diproteksi */}
        <Route
          path="/adminpanel"
          element={
            <ProtectedAdminRoute>
              <AdminPanel />
            </ProtectedAdminRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
