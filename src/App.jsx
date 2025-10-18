import { Routes, Route, Link } from "react-router-dom";
// Changed "./components/..." to "components/..."
import MenuList from "./components/Menulist.jsx";
import AdminPanel from "./components/AdminPanel.jsx";
import AdminLogin from './components/AdminLogin.jsx';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-amber-50 font-sans">
      {/* Navbar */}
      <nav className="bg-blue-800 text-white p-4 shadow-xl flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-3xl font-extrabold tracking-wider cursor-pointer">
          <Link to="/" className="text-amber-200 hover:text-white transition duration-200">
            Kapehan ni Marl
          </Link>
        </h1>
        <div className="flex gap-6 items-center">
          <Link
            to="/menu"
            className="text-lg font-medium hover:text-amber-200 transition-all duration-200 border-b-2 border-transparent hover:border-amber-200 pb-1"
          >
            Menu
          </Link>
          <Link
            // 🛑 Added this link so users can access the AdminLogin page 🛑
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
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <Routes>
          {/* 🛑 FIX: Added the default route for the home page 🛑 */}
          <Route path="/" element={<MenuList />} /> 
          
          <Route path="/menu" element={<MenuList />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminPanel />} />
          
          {/* Fallback route for any unmatched path */}
          <Route path="*" element={<div className="text-center text-xl text-gray-500 mt-20">404: Page not found.</div>} />
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
