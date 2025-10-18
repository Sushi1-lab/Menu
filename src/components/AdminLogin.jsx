import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/admin";
    } catch (error) {
      alert("Invalid login credentials!");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-amber-50">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm text-center"
      >
        <h2 className="text-2xl font-bold text-blue-900 mb-4">Admin Login</h2>
        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-3 rounded w-full mb-3"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-3 rounded w-full mb-4"
          required
        />
        <button
          type="submit"
          className="bg-blue-900 text-white w-full py-2 rounded hover:bg-blue-800 transition"
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;
