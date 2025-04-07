// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import GuestLogin from "./pages/GuestLogin";
import WaitingRoom from "./pages/WaitingRoom";
import BidderRoom from "./pages/BidderRoom";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import RequireAuth from "./components/RequireAuth"; // <== tambahkan ini

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/guest-login" />} />
        <Route path="/guest-login" element={<GuestLogin />} />
        <Route path="/waiting-room" element={<WaitingRoom />} />
        <Route path="/bidder-room" element={<BidderRoom />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        
        {/* Lindungi halaman admin */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminPanel />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
