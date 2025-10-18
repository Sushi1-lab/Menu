import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";

function MenuList() {
  const [menu, setMenu] = useState([]);
  const [orderType, setOrderType] = useState(""); // Dine-In or Take-Out
  const [tableNumber, setTableNumber] = useState("");
  const [showMenu, setShowMenu] = useState(false);

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
  };

  // Selection form (before showing the menu)
  if (!showMenu) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-amber-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md"
        >
          <h2 className="text-2xl font-bold text-blue-900 text-center mb-6">
            Welcome to Café 
          </h2>

          <div className="mb-4">
            <label className="block font-semibold mb-2 text-gray-700">
              Select Order Type:
            </label>
            <div className="flex justify-around">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="orderType"
                  value="Dine-In"
                  checked={orderType === "Dine-In"}
                  onChange={(e) => setOrderType(e.target.value)}
                />
                Dine-In
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="orderType"
                  value="Take-Out"
                  checked={orderType === "Take-Out"}
                  onChange={(e) => setOrderType(e.target.value)}
                />
                Take-Out
              </label>
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

  // Menu screen
  return (
    <div className="p-6 bg-amber-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-900">
          {orderType === "Dine-In"
            ? `Table ${tableNumber} - Dine-In Menu`
            : "Take-Out Menu"}
        </h1>

        {orderType === "Dine-In" && (
          <button
            onClick={handleChangeTable}
            className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition"
          >
            Change Table
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menu.map((item, index) => (
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
              className="w-full h-40 object-cover rounded-lg"
            />
            <h2 className="text-lg font-semibold text-blue-900 mt-2">
              {item.name}
            </h2>
            <p className="text-sm text-gray-600">{item.description}</p>
            <p className="font-bold text-blue-800 mt-1">₱{item.price}</p>
            <p className="text-xs text-gray-500">Category: {item.category}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default MenuList;
