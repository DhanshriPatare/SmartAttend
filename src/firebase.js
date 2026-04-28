import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCYLZ1aXd94VjpaRCm1aVjXRqy4wVxr3G4",
  authDomain: "smartattend-16462.firebaseapp.com",
  projectId: "smartattend-16462",
  storageBucket: "smartattend-16462.firebasestorage.app",
  messagingSenderId: "12366620263",
  appId: "1:12366620263:web:7bafe6cd7797cb141f16c2"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
