
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAnwZhdcWXmxcHTj69UUQepu0wJ6eZwQCw",
  authDomain: "jr2-biblioteca-digital.firebaseapp.com",
  projectId: "jr2-biblioteca-digital",
  storageBucket: "jr2-biblioteca-digital.firebasestorage.app",
  messagingSenderId: "438432687390",
  appId: "1:438432687390:web:284ae35e23e120c43f150f"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
