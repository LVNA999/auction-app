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
        <Route path="/" element={<Navigate to="/guest-login" />} />
        <Route path="/guest-login" element={<GuestLogin />} />
        <Route path="/waiting-room" element={<WaitingRoom />} />
        <Route path="/bidder-room" element={<BidderRoom />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        
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
