// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBcT4OUabNTC0yp00UzMhBdycv-dSkIwKo",
  authDomain: "auction-app-1915f.firebaseapp.com",
  databaseURL: "https://auction-app-1915f-default-rtdb.firebaseio.com",
  projectId: "auction-app-1915f",
  storageBucket: "auction-app-1915f.firebasestorage.app",
  messagingSenderId: "431863047991",
  appId: "1:431863047991:web:162bde6daf49897e295cb2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getDatabase(app);

export { auth, provider, db };