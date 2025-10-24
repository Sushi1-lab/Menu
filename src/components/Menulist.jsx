import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

function MenuList() {
  const [menu, setMenu] = useState([]);
  const [orderType, setOrderType] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🥗 Fetch menu items
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

  // ✅ Handle Proceed button
  const handleProceed = () => {
    if (orderType === "") {
      alert("Please select Dine-In or Take-Out.");
      return;
    }

    if (orderType === "Dine-In" && tableNumber === "") {
      alert("Please enter a table number.");
      return;
    }

    setShowMenu(true);
  };

  const handleChangeTable = () => {
    setShowMenu(false);
    setTableNumber("");
    setCart([]);
  };

  // 🔧 Group menu items by category
  const groupByCategory = (items) => {
    return items.reduce((groups, item) => {
      const category = item.category || "Uncategorized";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    }, {});
  };

  // 🛒 Add item to cart
  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.id === item.id);
      if (existingItem) {
        return prevCart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  // ➖ Remove item
  const removeFromCart = (itemId) => {
    setCart((prevCart) =>
      prevCart
        .map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  // 🧮 Compute total
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // ✅ CHECKOUT FUNCTION — Save order & send admin notification
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Save the order to Firestore
      const orderRef = await addDoc(collection(db, "orders"), {
        orderType,
        tableNumber: orderType === "Dine-In" ? tableNumber : null,
        items: cart.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalAmount,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      // 2️⃣ Create a notification for the admin
      await addDoc(collection(db, "notifications"), {
        message:
          orderType === "Dine-In"
            ? `🪑 New Dine-In Order (Table ${tableNumber})`
            : "🥡 New Take-Out Order Received",
        orderId: orderRef.id,
        read: false,
        createdAt: serverTimestamp(),
      });

      // 3️⃣ Confirm to user
      alert("✅ Order placed successfully! The admin has been notified.");

      // 4️⃣ Reset checkout state
      setCart([]);
      setShowCart(false);
      setShowMenu(false);
      setOrderType("");
      setTableNumber("");
    } catch (error) {
      console.error("Error saving order:", error);
      alert("⚠️ Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 👇 Selection form (before showing the menu)
  if (!showMenu) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-amber-50 p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md"
        >
          <h2 className="text-2xl font-bold text-blue-900 text-center mb-6">
            Welcome to Café
          </h2>

          {/* 🟢 Modern Dine-In / Take-Out Buttons */}
          <div className="mb-6">
            <label className="block font-semibold mb-3 text-gray-700 text-center text-lg">
              Select Order Type
            </label>
            <div className="flex justify-center gap-4 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOrderType("Dine-In")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all border-2 ${
                  orderType === "Dine-In"
                    ? "bg-blue-900 text-white border-blue-900 shadow-lg"
                    : "bg-white text-blue-900 border-blue-200 hover:bg-blue-50"
                }`}
              >
                🍽️ Dine-In
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOrderType("Take-Out")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all border-2 ${
                  orderType === "Take-Out"
                    ? "bg-blue-900 text-white border-blue-900 shadow-lg"
                    : "bg-white text-blue-900 border-blue-200 hover:bg-blue-50"
                }`}
              >
                🥡 Take-Out
              </motion.button>
            </div>
          </div>

          {orderType === "Dine-In" && (
            <div className="mb-4">
              <label className="block font-semibold mb-2 text-gray-700">
                Table Number:
              </label>
              <input
                type="number"
                placeholder="Enter table number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="border p-2 rounded w-full"
              />
            </div>
          )}

          <button
            onClick={handleProceed}
            className="bg-blue-900 text-white p-3 w-full rounded-lg hover:bg-blue-800 transition"
          >
            Proceed to Menu
          </button>
        </motion.div>
      </div>
    );
  }

  // 👇 Menu screen
  const groupedMenu = groupByCategory(menu);
  const sortedCategories = Object.keys(groupedMenu).sort();

  return (
    <div className="p-4 sm:p-6 bg-amber-50 min-h-screen relative">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-blue-900 text-center sm:text-left">
          {orderType === "Dine-In"
            ? `Table ${tableNumber} - Dine-In Menu`
            : "Take-Out Menu"}
        </h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center sm:justify-end">
          {orderType === "Dine-In" && (
            <button
              onClick={handleChangeTable}
              className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition"
            >
              Change Table
            </button>
          )}

          {/* 🛒 Cart Button */}
          <button
            onClick={() => setShowCart(!showCart)}
            className="relative bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition"
          >
            Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </button>
        </div>
      </div>

      {/* MENU LIST */}
      {sortedCategories.map((category) => (
        <div key={category} className="mb-10">
          <h2 className="text-xl font-bold text-blue-900 mb-4 border-b pb-1">
            {category}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedMenu[category].map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-40 sm:h-48 md:h-56 object-cover rounded-lg"
                />
                <h3 className="text-lg font-semibold text-blue-900 mt-2">
                  {item.name}
                </h3>
                <p className="text-sm text-gray-600">{item.description}</p>
                <p className="font-bold text-blue-800 mt-1">₱{item.price}</p>

                <button
                  onClick={() => addToCart(item)}
                  className="mt-3 bg-blue-900 text-white w-full py-2 rounded-lg hover:bg-blue-800 transition"
                >
                  Add to Cart
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* 🛍️ CART SIDEBAR */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 100 }}
            className="fixed top-0 right-0 w-full sm:w-80 md:w-96 h-full bg-white shadow-2xl p-4 sm:p-6 z-50 flex flex-col"
          >
            <h2 className="text-xl font-bold text-blue-900 mb-4">Your Cart</h2>
            {cart.length === 0 ? (
              <p className="text-gray-600 text-center mt-10">
                Your cart is empty.
              </p>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center mb-4 border-b pb-2"
                  >
                    <div>
                      <h3 className="font-semibold text-blue-900">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        ₱{item.price} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="bg-gray-200 px-2 rounded hover:bg-gray-300"
                      >
                        -
                      </button>
                      <button
                        onClick={() => addToCart(item)}
                        className="bg-gray-200 px-2 rounded hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TOTAL */}
            {cart.length > 0 && (
              <div className="border-t pt-4">
                <p className="font-semibold text-blue-900">
                  Total: ₱{totalAmount.toFixed(2)}
                </p>
                <button
                  disabled={loading}
                  onClick={handleCheckout}
                  className={`mt-4 bg-blue-900 text-white w-full py-2 rounded-lg transition ${
                    loading
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:bg-blue-800"
                  }`}
                >
                  {loading ? "Processing..." : "Checkout"}
                </button>
              </div>
            )}

            <button
              onClick={() => setShowCart(false)}
              className="mt-6 text-gray-500 hover:text-gray-700 text-sm"
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
