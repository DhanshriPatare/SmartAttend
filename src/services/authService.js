import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export const authService = {
  login: async (email, pass) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    if (!userDoc.exists()) throw new Error("User profile not found");
    return { uid: userCredential.user.uid, ...userDoc.data() };
  },

  signUp: async (email, pass, name, role) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const profile = {
      uid: userCredential.user.uid,
      email,
      name,
      role
    };
    await setDoc(doc(db, "users", userCredential.user.uid), profile);
    return profile;
  },

  logout: () => signOut(auth),

  getUserProfile: async (uid) => {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) return null;
    return { uid, ...userDoc.data() };
  },

  onAuthChange: (callback) => {
    return onAuthStateChanged(auth, callback);
  }
};
