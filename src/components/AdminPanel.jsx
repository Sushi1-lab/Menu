import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";

function AdminPanel() {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
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
  const [notifications, setNotifications] = useState([]);

  // ✅ Handle auth state (admin login)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Fetch menu
  const fetchMenu = async () => {
    const querySnapshot = await getDocs(collection(db, "menu"));
    const items = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setMenu(items);
  };

  // ✅ Realtime listener for orders (includes notifications)
  useEffect(() => {
    if (!user) return;

    const ordersRef = collection(db, "orders");
    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      const newOrders = [];
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          newOrders.push({ id: change.doc.id, ...change.doc.data() });
        }
      });

      // ✅ Notify admin of new orders
      if (newOrders.length > 0) {
        newOrders.forEach((order) => {
          showNotification(
            `🛎️ New Order Received!`,
            `Table ${order.tableNumber || "N/A"} - ₱${order.totalAmount || 0}`
          );
        });
      }

      // ✅ Update full orders list
      const allOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(allOrders);
    });

    return () => unsubscribe();
  }, [user]);

  // ✅ Notification display logic
  const showNotification = (title, message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, title, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000); // hide after 4s
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const itemData = { ...newItem, price: Number(newItem.price) };

    try {
      if (editingId) {
        const docRef = doc(db, "menu", editingId);
        await updateDoc(docRef, itemData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, "menu"), itemData);
      }

      setNewItem({
        name: "",
        price: "",
        category: "",
        image: "",
        description: "",
      });
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

  const updateOrderStatus = async (orderId, newStatus) => {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { status: newStatus });
  };

  const exportToExcel = () => {
    if (orders.length === 0) {
      alert("No orders to export yet.");
      return;
    }

    const formattedOrders = orders.map((order) => ({
      OrderID: order.id,
      Date: order.createdAt
        ? new Date(order.createdAt.seconds * 1000).toLocaleString()
        : "N/A",
      Table: order.tableNumber || "N/A",
      Type: order.orderType || "N/A",
      Status: order.status || "N/A",
      Items: order.items
        ? order.items.map((i) => `${i.name} x${i.quantity}`).join(", ")
        : "",
      TotalAmount: order.totalAmount || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(formattedOrders);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");

    const columnWidths = Object.keys(formattedOrders[0]).map(() => ({ wch: 20 }));
    ws["!cols"] = columnWidths;

    const month = new Date().toLocaleString("default", { month: "long" });
    const year = new Date().getFullYear();
    const fileName = `Orders_${month}_${year}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-blue-900">
        Checking admin access...
      </div>
    );
  }

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

  const pendingOrders = orders.filter((o) => o.status === "Pending");
  const acknowledgedOrders = orders.filter((o) => o.status === "Acknowledged");
  const servingOrders = orders.filter((o) => o.status === "Serving");
  const servedOrders = orders.filter((o) => o.status === "Served");

  return (
    <div className="relative p-6 max-w-7xl mx-auto space-y-10 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-800">
          Admin Panel — Manage Menu & Orders
        </h1>
        <div className="flex gap-3">
          <button
            onClick={exportToExcel}
            className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            Export Monthly Orders
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      {/* ---------------- MENU MANAGEMENT ---------------- */}
      <section>
        <h2 className="text-2xl font-semibold text-blue-900 mb-4">
          Manage Menu
        </h2>

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
            <option value="Pasta">Pasta</option>
            <option value="Others">Others</option>
          </select>

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
              className="w-full h-32 object-cover rounded sm:col-span-2"
            />
          )}

          <textarea
            placeholder="Description"
            className="border p-3 rounded sm:col-span-2"
            value={newItem.description}
            onChange={(e) =>
              setNewItem({ ...newItem, description: e.target.value })
            }
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
              transition={{ delay: index * 0.05 }}
              className="bg-white border rounded-xl shadow hover:shadow-lg transition duration-300 p-4"
            >
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-40 object-cover rounded-lg"
                />
              )}
              <div className="mt-3">
                <h2 className="text-lg font-semibold text-blue-900">
                  {item.name}
                </h2>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {item.description}
                </p>
                <p className="font-bold text-blue-800 mt-2">₱{item.price}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Category: {item.category}
                </p>
              </div>
              <div className="flex justify-between mt-4">
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
      </section>

      {/* ---------------- CUSTOMER ORDERS ---------------- */}
      <section>
        <h2 className="text-2xl font-semibold text-blue-900 mt-10 mb-4">
          Customer Orders
        </h2>

        <OrderSection
          title="Pending Orders"
          orders={pendingOrders}
          onStatusChange={updateOrderStatus}
          nextStatus="Acknowledged"
        />

        <OrderSection
          title="Preparing Orders"
          orders={acknowledgedOrders}
          onStatusChange={updateOrderStatus}
          nextStatus="Serving"
        />

        <OrderSection
          title="Serving Orders"
          orders={servingOrders}
          onStatusChange={updateOrderStatus}
          nextStatus="Served"
        />

        <OrderSection title="Served Orders" orders={servedOrders} readOnly />
      </section>

      {/* ✅ Notification Box (Bottom-Right Corner) */}
      <div className="fixed bottom-5 right-5 space-y-3 z-50">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              className="bg-blue-900 text-white p-4 rounded-lg shadow-lg w-72"
            >
              <p className="font-semibold">{n.title}</p>
              <p className="text-sm text-blue-100">{n.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OrderSection({ title, orders, onStatusChange, nextStatus, readOnly }) {
  return (
    <div className="mb-10">
      <h3 className="text-xl font-bold text-blue-800 mb-3">{title}</h3>
      {orders.length === 0 ? (
        <p className="text-gray-600 bg-white p-4 rounded-xl shadow">
          No orders in this section.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border rounded-xl shadow hover:shadow-lg transition duration-300 p-4"
            >
              <h3 className="text-lg font-bold text-blue-900 mb-1">
                Order #{index + 1}
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                Placed:{" "}
                {order.createdAt
                  ? new Date(order.createdAt.seconds * 1000).toLocaleString()
                  : "N/A"}
              </p>

              <p className="text-sm text-gray-700">
                <strong>Type:</strong> {order.orderType}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Table:</strong> {order.tableNumber}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Status:</strong>{" "}
                <span
                  className={`${
                    order.status === "Pending"
                      ? "text-yellow-600"
                      : order.status === "Acknowledged"
                      ? "text-blue-700"
                      : order.status === "Serving"
                      ? "text-orange-600"
                      : "text-green-700"
                  } font-medium`}
                >
                  {order.status}
                </span>
              </p>

              <h4 className="mt-3 font-semibold text-blue-800">Items:</h4>
              <ul className="list-disc ml-5 text-sm text-gray-600">
                {order.items?.map((item, i) => (
                  <li key={i}>
                    {item.name} × {item.quantity} — ₱{item.price}
                  </li>
                ))}
              </ul>

              <p className="mt-3 font-bold text-blue-900">
                Total: ₱{order.totalAmount || 0}
              </p>

              {!readOnly && (
                <button
                  onClick={() => onStatusChange(order.id, nextStatus)}
                  className="mt-4 bg-blue-800 text-white w-full py-2 rounded hover:bg-blue-900"
                >
                  Mark as {nextStatus}
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
