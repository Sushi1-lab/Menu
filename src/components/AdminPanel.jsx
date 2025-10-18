import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "../firebase"; // ✅ Make sure auth is exported from firebase.js
import { onAuthStateChanged, signOut } from "firebase/auth";
import { motion } from "framer-motion";

function AdminPanel() {
  const [menu, setMenu] = useState([]);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    category: "",
    image: "",
    description: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Listen for Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Fetch menu items
  const fetchMenu = async () => {
    const querySnapshot = await getDocs(collection(db, "menu"));
    const items = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setMenu(items);
  };

  useEffect(() => {
    if (user) fetchMenu();
  }, [user]);

  // 🔹 Add or update menu item
  const handleSubmit = async (e) => {
    e.preventDefault();

    const itemData = {
      ...newItem,
      price: Number(newItem.price),
    };

    try {
      if (editingId) {
        const docRef = doc(db, "menu", editingId);
        await updateDoc(docRef, itemData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, "menu"), itemData);
      }

      setNewItem({ name: "", price: "", category: "", image: "", description: "" });
      fetchMenu();
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  const handleEdit = (item) => {
    setNewItem(item);
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "menu", id));
    fetchMenu();
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // 🔄 Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-blue-900">
        Checking admin access...
      </div>
    );
  }

  // ❌ If user is not logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-amber-50">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm text-center">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            Access Restricted
          </h2>
          <p className="text-gray-600 mb-4">
            Only authorized admins can access this panel.
          </p>
          <a
            href="/admin-login"
            className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800"
          >
            Go to Admin Login
          </a>
        </div>
      </div>
    );
  }

  // ✅ Main Admin Panel UI
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-800">
          Admin Panel - Manage Coffee Menu
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* Add / Edit Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-md grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10"
      >
        <input
          placeholder="Name"
          className="border p-3 rounded"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          required
        />

        <input
          placeholder="Price"
          className="border p-3 rounded"
          type="number"
          value={newItem.price}
          onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
          required
        />

        <select
          className="border p-3 rounded bg-white"
          value={newItem.category}
          onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
        >
          <option value="">Select Category</option>
          <option value="Coffee">Coffee</option>
          <option value="Non-Coffee">Non-Coffee</option>
          <option value="Pastry">Pastry</option>
          <option value="Dessert">Dessert</option>
          <option value="Others">Others</option>
        </select>

        {/* Image URL Input */}
        <input
          type="text"
          placeholder="Paste Image URL here"
          className="border p-3 rounded"
          value={newItem.image}
          onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
          required
        />
        {newItem.image && (
          <img
            src={newItem.image}
            alt="preview"
            className="w-full h-24 object-cover rounded sm:col-span-2"
          />
        )}

        <textarea
          placeholder="Description"
          className="border p-3 rounded sm:col-span-2"
          value={newItem.description}
          onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
        />

        <button
          type="submit"
          className="bg-blue-800 text-white p-3 rounded hover:bg-blue-900 sm:col-span-2 font-medium transition-all"
        >
          {editingId ? "Update Item" : "Add Menu Item"}
        </button>
      </form>

      {/* Menu List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menu.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border rounded-xl shadow hover:shadow-lg transition duration-300 p-4"
          >
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-40 object-cover rounded-lg"
              />
            )}
            <h2 className="text-lg font-semibold mt-3 text-blue-900">
              {item.name}
            </h2>
            <p className="text-sm text-gray-600">{item.description}</p>
            <p className="font-bold text-blue-800 mt-1">₱{item.price}</p>
            <p className="text-xs text-gray-500 mt-1">Category: {item.category}</p>

            <div className="flex justify-between mt-3">
              <button
                onClick={() => handleEdit(item)}
                className="bg-yellow-700 text-white px-3 py-1 rounded hover:bg-yellow-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="bg-red-700 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default AdminPanel;
