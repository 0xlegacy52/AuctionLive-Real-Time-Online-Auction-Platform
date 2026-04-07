import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Browse from "./pages/Browse";
import EndingSoon from "./pages/EndingSoon";
import CreateAuction from "./pages/CreateAuction";
import AuctionDetail from "./pages/AuctionDetail";
import MyAuctions from "./pages/MyAuctions";
import MyBids from "./pages/MyBids";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/ending-soon" element={<EndingSoon />} />
        <Route path="/auction/:id" element={<AuctionDetail />} />
        <Route path="/create" element={<ProtectedRoute><CreateAuction /></ProtectedRoute>} />
        <Route path="/my-auctions" element={<ProtectedRoute><MyAuctions /></ProtectedRoute>} />
        <Route path="/my-bids" element={<ProtectedRoute><MyBids /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}
