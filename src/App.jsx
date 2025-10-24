import { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { Menu, X } from "lucide-react"; // 🧩 Lucide icons
import MenuList from "./components/Menulist.jsx";
import AdminPanel from "./components/AdminPanel.jsx";
import AdminLogin from "./components/AdminLogin.jsx";

function App() {
  const [isOpen, setIsOpen] = useState(false); // 🟢 Burger menu toggle state

  return (
    <div className="min-h-screen flex flex-col bg-amber-50 font-sans">
      {/* Navbar */}
      <nav className="bg-blue-800 text-white p-4 shadow-xl sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          {/* Brand Name */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider cursor-pointer">
            <Link
              to="/"
              className="text-amber-200 hover:text-white transition duration-200"
              onClick={() => setIsOpen(false)} // close menu when clicked
            >
              Kapehan ni Marl
            </Link>
          </h1>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-6 items-center">
            <Link
              to="/menu"
              className="text-lg font-medium hover:text-amber-200 transition-all duration-200 border-b-2 border-transparent hover:border-amber-200 pb-1"
            >
              Menu
            </Link>
            <Link
              to="/admin-login"
              className="text-lg font-medium hover:text-amber-200 transition-all duration-200 border-b-2 border-transparent hover:border-amber-200 pb-1"
            >
              Admin Login
            </Link>
            <Link
              to="/admin"
              className="text-lg font-medium bg-amber-400 text-blue-900 px-4 py-2 rounded-full shadow-md hover:bg-amber-300 transition-all duration-200"
            >
              Admin Panel
            </Link>
          </div>

          {/* Mobile Burger Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-amber-200 hover:text-white transition"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isOpen && (
          <div className="md:hidden flex flex-col items-center gap-4 mt-4 bg-blue-700 py-4 rounded-lg shadow-lg">
            <Link
              to="/menu"
              onClick={() => setIsOpen(false)}
              className="text-lg font-medium hover:text-amber-200 transition-all duration-200"
            >
              Menu
            </Link>
            <Link
              to="/admin-login"
              onClick={() => setIsOpen(false)}
              className="text-lg font-medium hover:text-amber-200 transition-all duration-200"
            >
              Admin Login
            </Link>
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className="text-lg font-medium bg-amber-400 text-blue-900 px-4 py-2 rounded-full shadow-md hover:bg-amber-300 transition-all duration-200"
            >
              Admin Panel
            </Link>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<MenuList />} />
          <Route path="/menu" element={<MenuList />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route
            path="*"
            element={
              <div className="text-center text-xl text-gray-500 mt-20">
                404: Page not found.
              </div>
            }
          />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-amber-100 py-4 text-center text-sm shadow-inner mt-auto">
        © {new Date().getFullYear()} Kapehan ni Marl. All Rights Reserved.
      </footer>
    </div>
  );
}

export default App;
