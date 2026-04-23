import { 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch,
  doc,
  Timestamp 
} from "firebase/firestore";
import { db } from "../firebase";

export const attendanceService = {
  submitAttendance: async (records) => {
    const batch = writeBatch(db);
    const dateStr = new Date().toISOString().split('T')[0];

    records.forEach((record) => {
      const attendanceRef = doc(collection(db, "attendance"));
      batch.set(attendanceRef, {
        ...record,
        date: dateStr,
        timestamp: Timestamp.now()
      });
    });

    await batch.commit();
  },

  getStudentAttendance: async (studentId) => {
    const q = query(collection(db, "attendance"), where("studentId", "==", studentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  getClassAttendance: async (classId) => {
    const q = query(collection(db, "attendance"), where("classId", "==", classId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};
