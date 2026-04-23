import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { db } from "../firebase";

export const sessionService = {
  startSession: async (facultyId: string, classId: string, subjectCode: string) => {
    const sessionData = {
      teacherId: facultyId,
      classId,
      subjectCode,
      startTime: serverTimestamp(),
      isActive: true
    };
    const docRef = await addDoc(collection(db, "sessions"), sessionData);
    
    // Auto-close session after 10 minutes (client-side safety, should ideally be background task)
    setTimeout(async () => {
      await updateDoc(doc(db, "sessions", docRef.id), { isActive: false });
    }, 10 * 60 * 1000);

    return docRef.id;
  },

  getActiveSession: async (classId: string) => {
    const q = query(
      collection(db, "sessions"), 
      where("classId", "==", classId), 
      where("isActive", "==", true)
    );
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }
};
