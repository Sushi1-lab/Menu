// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCU6WnJCL3HRL6LjT2XeP1I94vKMnwRGwg",
  authDomain: "project1-8a823.firebaseapp.com",
  projectId: "project1-8a823",
  storageBucket: "project1-8a823.appspot.com", // ✅ fix the .app to .appspot.com
  messagingSenderId: "507709834427",
  appId: "1:507709834427:web:c806d200721803b083959e",
  measurementId: "G-E8HWGSNEMS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore and Storage
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
