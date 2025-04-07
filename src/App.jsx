import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GuestLogin from "./pages/GuestLogin";
import WaitingRoom from "./pages/WaitingRoom";
import BidderRoom from "./pages/BidderRoom";
import AdminPanel from "./pages/AdminPanel";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GuestLogin />} />
        <Route path="/guest-login" element={<GuestLogin />} />
        <Route path="/waiting-room" element={<WaitingRoom />} />
        <Route path="/bidder-room" element={<BidderRoom />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;
