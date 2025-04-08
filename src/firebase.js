// src/firebase.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage"; // ⬅️ Tambahan ini

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBcT4OUabNTC0yp00UzMhBdycv-dSkIwKo",
  authDomain: "auction-app-1915f.firebaseapp.com",
  databaseURL: "https://auction-app-1915f-default-rtdb.firebaseio.com",
  projectId: "auction-app-1915f",
  storageBucket: "auction-app-1915f.appspot.com", // ⬅️ Format domain diperbaiki
  messagingSenderId: "431863047991",
  appId: "1:431863047991:web:162bde6daf49897e295cb2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getDatabase(app);
const storage = getStorage(app); // ⬅️ Tambahkan inisialisasi storage

// Export all Firebase services
export { auth, provider, db, storage };
