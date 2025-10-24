import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

function AdminOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(newOrders);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📬 New Orders</h2>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <ul>
          {orders.map((order) => (
            <li key={order.id} className="border p-4 mb-3 rounded bg-white shadow">
              <p>
                <strong>Type:</strong> {order.orderType}
              </p>
              {order.tableNumber && (
                <p>
                  <strong>Table:</strong> {order.tableNumber}
                </p>
              )}
              <p>
                <strong>Total:</strong> ₱{order.totalAmount}
              </p>
              <p>
                <strong>Status:</strong> {order.status}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminOrders;
