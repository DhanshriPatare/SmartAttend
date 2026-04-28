import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export const facultyService = {
  getAssignedClasses: async (teacherId) => {
    const q = query(collection(db, "classes"), where("teacherId", "==", teacherId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  getAllClasses: async () => {
    const q = query(collection(db, "classes"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  claimClass: async (teacherId, classDocId) => {
    const classRef = doc(db, "classes", classDocId);
    await updateDoc(classRef, {
      teacherId: teacherId
    });
    return { success: true };
  },

  createClass: async (teacherId, classData) => {
    const { classId } = classData;
    const classRef = doc(db, "classes", classId);
    await setDoc(classRef, {
      ...classData,
      teacherId,
      createdAt: new Date().toISOString()
    });
    return { id: classId, ...classData };
  },

  getEnrolledStudents: async (classId) => {
    // 1. Get enrollments for this class
    const q = query(collection(db, "enrollments"), where("classId", "==", classId));
    const enrollmentSnapshot = await getDocs(q);
    const studentIds = enrollmentSnapshot.docs.map(doc => doc.data().studentId);
    
    if (studentIds.length === 0) return [];

    // 2. Fetch user details for these student IDs
    const students = [];
    for (const sid of studentIds) {
        // Try fetching by doc ID first (most common patterns in the screenshot)
        const userDocRef = doc(db, "users", sid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
            students.push({ uid: sid, ...userDocSnap.data() });
        } else {
            // Fallback: search by 'uid' field if doc ID is a Firebase Auth UID
            const userQ = query(collection(db, "users"), where("uid", "==", sid));
            const userSnap = await getDocs(userQ);
            if (!userSnap.empty) {
                students.push({ uid: sid, ...userSnap.docs[0].data() });
            }
        }
    }
    return students;
  }
};
