import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

// ✅ Generate short Order Code (5 random alphanumeric)
const generateOrderCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

function MenuList() {
  const [menu, setMenu] = useState([]);
  const [orderType, setOrderType] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [orders, setOrders] = useState([]);

  // 🥗 Fetch menu
  useEffect(() => {
    const fetchMenu = async () => {
      const querySnapshot = await getDocs(collection(db, "menu"));
      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMenu(items);
    };
    fetchMenu();
  }, []);

  // 🟢 Real-time queue listener + Auto delete expired (2 mins old)
  useEffect(() => {
    if (showQueue) {
      const unsubscribe = onSnapshot(collection(db, "orders"), async (snapshot) => {
        const now = Date.now();
        const validOrders = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const createdAt = data.createdAt?.seconds
            ? data.createdAt.seconds * 1000
            : null;

          // ⏳ Delete orders older than 2 minutes
          if (createdAt && now - createdAt > 2 * 60 * 1000) {
            try {
              await deleteDoc(doc(db, "orders", docSnap.id));
              console.log(`🗑️ Deleted expired order: ${docSnap.id}`);
            } catch (err) {
              console.error("Error deleting order:", err);
            }
          } else {
            validOrders.push({ id: docSnap.id, ...data });
          }
        }

        setOrders(
          validOrders.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
        );
      });
      return () => unsubscribe();
    }
  }, [showQueue]);

  // ✅ Proceed
  const handleProceed = () => {
    if (!orderType) {
      Swal.fire({
        icon: "warning",
        title: "Select Order Type",
        text: "Please choose between Dine-In or Take-Out before proceeding.",
        confirmButtonColor: "#1e3a8a",
      });
      return;
    }
    if (orderType === "Dine-In" && !tableNumber) {
      Swal.fire({
        icon: "info",
        title: "Missing Table Number",
        text: "Please enter your table number.",
        confirmButtonColor: "#1e3a8a",
      });
      return;
    }
    setShowMenu(true);
  };

  // 🔧 Group menu
  const groupByCategory = (items) =>
    items.reduce((groups, item) => {
      const category = item.category || "Uncategorized";
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
      return groups;
    }, {});

  // 🛒 Add / Remove
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      return existing
        ? prev.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          )
        : [...prev, { ...item, quantity: 1 }];
    });
    Swal.fire({
      title: "Added!",
      text: `${item.name} added to cart.`,
      icon: "success",
      timer: 1000,
      showConfirmButton: false,
    });
  };

  const removeFromCart = (id) =>
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // ✅ Checkout with short Order Code
  const handleCheckout = async () => {
    if (cart.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Empty Cart",
        text: "Please add items before checkout.",
        confirmButtonColor: "#1e3a8a",
      });
      return;
    }

    try {
      setLoading(true);
      const orderCode = generateOrderCode();

      const orderRef = await addDoc(collection(db, "orders"), {
        orderCode,
        orderType,
        tableNumber: orderType === "Dine-In" ? tableNumber : null,
        items: cart.map((i) => ({
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        totalAmount,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, "notifications"), {
        message:
          orderType === "Dine-In"
            ? `🪑 New Dine-In Order (Table ${tableNumber})`
            : "🥡 New Take-Out Order Received",
        orderId: orderRef.id,
        read: false,
        createdAt: serverTimestamp(),
      });

    Swal.fire({
  title: "✅ Order Placed!",
  html: `
    <p>Your order is now being processed 🎉</p>
    <p><strong>Order Code:</strong> 
    <span style="font-size:1.5em; color:#1e3a8a;">${orderCode}</span></p>
    <button id="proceedCounterBtn" 
      style="margin-top:15px; background-color:#1e3a8a; color:white; border:none; 
      padding:10px 20px; border-radius:8px; cursor:pointer;">
      Proceed to Counter
    </button>
  `,
  icon: "success",
  showConfirmButton: false,
  didOpen: () => {
    document
      .getElementById("proceedCounterBtn")
      .addEventListener("click", () => {
        Swal.fire({
          title: "💰 Proceed to Counter",
          text: "Please proceed to the counter for payment. Thank you!",
          icon: "info",
          confirmButtonColor: "#1e3a8a",
        });
      });
  },
});


      setCart([]);
      setShowCart(false);
      setShowMenu(false);
      setOrderType("");
      setTableNumber("");
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Order Failed",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Show queue
  if (showQueue) {
    return (
      <div className="min-h-screen bg-amber-50 p-6">
        <h1 className="text-2xl font-bold text-blue-900 mb-4 text-center">
          🧾 Queueing Orders
        </h1>
        <button
          onClick={() => setShowQueue(false)}
          className="mb-6 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
        >
          Back to Home
        </button>

        {orders.length === 0 ? (
          <p className="text-gray-700 text-center">No active orders yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition"
              >
                <h2 className="font-bold text-blue-900 text-lg">
                  Order Code: {order.orderCode}
                </h2>
                <p className="text-gray-600">
                  {order.orderType}{" "}
                  {order.tableNumber && `(Table ${order.tableNumber})`}
                </p>
                <p className="mt-1 text-sm">
                  <b>Status:</b> {order.status}
                </p>
                <ul className="mt-2 text-sm text-gray-700 list-disc ml-4">
                  {order.items.map((i, idx) => (
                    <li key={idx}>
                      {i.name} × {i.quantity}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 font-semibold">
                  Total: ₱{order.totalAmount?.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 🧾 Initial screen
  if (!showMenu) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-amber-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md"
        >
          <h2 className="text-2xl font-bold text-blue-900 text-center mb-6">
            Welcome to Café
          </h2>

          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={() => setOrderType("Dine-In")}
              className={`p-3 rounded-lg border ${
                orderType === "Dine-In"
                  ? "bg-blue-900 text-white"
                  : "bg-white text-blue-900 border-blue-300"
              }`}
            >
              🍽️ Dine-In
            </button>
            <button
              onClick={() => setOrderType("Take-Out")}
              className={`p-3 rounded-lg border ${
                orderType === "Take-Out"
                  ? "bg-blue-900 text-white"
                  : "bg-white text-blue-900 border-blue-300"
              }`}
            >
              🥡 Take-Out
            </button>
          </div>

          {orderType === "Dine-In" && (
            <input
              type="number"
              placeholder="Enter Table Number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="border p-2 rounded w-full mb-4"
            />
          )}

          <button
            onClick={handleProceed}
            className="bg-blue-900 text-white p-3 w-full rounded-lg mb-3"
          >
            Proceed to Menu
          </button>

          <button
            onClick={() => setShowQueue(true)}
            className="bg-gray-200 text-blue-900 p-3 w-full rounded-lg font-semibold"
          >
            🧾 View Queueing Orders
          </button>
        </motion.div>
      </div>
    );
  }

  // 🍽️ Menu Screen
  const groupedMenu = groupByCategory(menu);
  const categories = Object.keys(groupedMenu).sort();

  return (
    <div className="p-4 sm:p-6 bg-amber-50 min-h-screen relative">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-blue-900 text-center sm:text-left">
          {orderType === "Dine-In"
            ? `Table ${tableNumber} - Dine-In`
            : "Take-Out Menu"}
        </h1>

        <button
          onClick={() => setShowCart(!showCart)}
          className="bg-blue-900 text-white px-4 py-2 rounded-lg"
        >
          Cart ({cart.reduce((a, i) => a + i.quantity, 0)})
        </button>
      </div>

      {/* MENU */}
      {categories.map((cat) => (
        <div key={cat} className="mb-10">
          <h2 className="text-xl font-bold text-blue-900 mb-4 border-b pb-1">
            {cat}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedMenu[cat].map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow p-4 hover:shadow-lg"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <h3 className="text-lg font-semibold text-blue-900 mt-2">
                  {item.name}
                </h3>
                <p className="text-sm text-gray-600">{item.description}</p>
                <p className="font-bold text-blue-800 mt-1">₱{item.price}</p>
                <button
                  onClick={() => addToCart(item)}
                  className="mt-3 bg-blue-900 text-white w-full py-2 rounded-lg"
                >
                  Add to Cart
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* CART SIDEBAR */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="fixed top-0 right-0 w-full sm:w-80 bg-white h-full shadow-2xl p-6 z-50"
          >
            <h2 className="text-xl font-bold text-blue-900 mb-4">Your Cart</h2>
            {cart.length === 0 ? (
              <p className="text-gray-600 text-center mt-10">Cart is empty.</p>
            ) : (
              <>
                <div className="overflow-y-auto flex-1">
                  {cart.map((i) => (
                    <div
                      key={i.id}
                      className="flex justify-between items-center mb-4 border-b pb-2"
                    >
                      <div>
                        <h3 className="font-semibold">{i.name}</h3>
                        <p className="text-sm text-gray-600">
                          ₱{i.price} × {i.quantity}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => removeFromCart(i.id)}
                          className="px-2 bg-gray-200 rounded"
                        >
                          -
                        </button>
                        <button
                          onClick={() => addToCart(i)}
                          className="px-2 bg-gray-200 rounded"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="font-semibold text-blue-900 mt-3">
                  Total: ₱{totalAmount.toFixed(2)}
                </p>

                <button
                  disabled={loading}
                  onClick={handleCheckout}
                  className={`mt-4 bg-blue-900 text-white w-full py-2 rounded-lg ${
                    loading ? "opacity-60" : "hover:bg-blue-800"
                  }`}
                >
                  {loading ? "Processing..." : "Checkout"}
                </button>
              </>
            )}

            <button
              onClick={() => setShowCart(false)}
              className="mt-4 text-gray-600 hover:text-gray-800 text-sm"
            >
              Close Cart
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MenuList;
