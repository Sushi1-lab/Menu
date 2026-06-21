import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { User, Shield } from "lucide-react";

import MenuList from "./components/Menulist.jsx";
import AdminPanel from "./components/AdminPanel.jsx";
import AdminLogin from "./components/AdminLogin.jsx";

function RoleSelect() {
  const navigate = useNavigate();
  const [guestName, setGuestName] = useState("");

  const handleGuestContinue = () => {
    const finalName = guestName.trim() || "Guest";
    localStorage.setItem("customerName", finalName);
    navigate("/menu");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 px-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6">
        
        {/* Customer */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-amber-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-amber-100 p-3 rounded-full">
              <User className="text-amber-700" size={28} />
            </div>
            <h2 className="text-2xl font-bold text-blue-900">Customer</h2>
          </div>

          <p className="text-gray-600 mb-5">
            Continue as a guest and place your order.
          </p>

          <input
            type="text"
            placeholder="Enter your name (optional)"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 mb-4"
          />

          <button
            onClick={handleGuestContinue}
            className="w-full bg-amber-400 text-blue-900 font-semibold py-3 rounded-lg hover:bg-amber-300"
          >
            Continue as Guest
          </button>
        </div>

        {/* Admin */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Shield className="text-blue-800" size={28} />
            </div>
            <h2 className="text-2xl font-bold text-blue-900">Admin</h2>
          </div>

          <p className="text-gray-600 mb-5">
            Login to manage menu items and customer orders.
          </p>

          <button
            onClick={() => navigate("/admin-login")}
            className="w-full bg-blue-800 text-white font-semibold py-3 rounded-lg hover:bg-blue-700"
          >
            Login as Admin
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuWrapper() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="p-4 bg-white shadow flex justify-between items-center">
        <h1 className="font-bold text-xl text-blue-900">
          Customer Menu
        </h1>

        <button
          onClick={() => navigate("/")}
          className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Back
        </button>
      </div>

      <MenuList />
    </div>
  );
}

function AdminWrapper() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="p-4 bg-white shadow flex justify-between items-center">
        <h1 className="font-bold text-xl text-blue-900">
          Admin Panel
        </h1>

        <div className="flex gap-2">
          <button
            onClick={() => navigate("/menu")}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600"
          >
            Customer View
          </button>

          <button
            onClick={() => navigate("/")}
            className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back
          </button>
        </div>
      </div>

      <AdminPanel />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelect />} />
      <Route path="/menu" element={<MenuWrapper />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminWrapper />} />

      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center">
            <h1 className="text-2xl text-gray-500">
              404 - Page Not Found
            </h1>
          </div>
        }
      />
    </Routes>
  );
}

export default App;