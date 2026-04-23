import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export const studentService = {
  getStudentAnalytics: async (studentId) => {
    // 1. Get all classes the student is enrolled in
    const enrolledQ = query(collection(db, "enrollments"), where("studentId", "==", studentId));
    const enrolledSnap = await getDocs(enrolledQ);
    const classIds = enrolledSnap.docs.map(doc => doc.data().classId);

    if (classIds.length === 0) return { overall: 0, analytics: [] };

    // 2. Get all attendance records for this student
    const attendanceQ = query(collection(db, "attendance"), where("studentId", "==", studentId));
    const attendanceSnap = await getDocs(attendanceQ);
    const attendanceRecords = attendanceSnap.docs.map(doc => doc.data());

    // 3. Process analytics for each class
    const analytics = [];
    let totalPresent = 0;
    let totalClasses = 0;

    for (const cid of classIds) {
        // Get class details
        const classQ = query(collection(db, "classes"), where("classId", "==", cid));
        const classSnap = await getDocs(classQ);
        if (classSnap.empty) continue;
        
        const classData = classSnap.docs[0].data();
        const subjectName = classData.subjectName;
        const subjectCode = classData.subjectCode;

        // Filter attendance for this class
        const classAttendance = attendanceRecords.filter(r => r.classId === cid);
        const presentCount = classAttendance.filter(r => r.status === "present").length;
        const totalCount = classAttendance.length;

        const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

        analytics.push({
            subjectName,
            subjectCode,
            percentage,
            total: totalCount,
            present: presentCount
        });

        totalPresent += presentCount;
        totalClasses += totalCount;
    }

    const overall = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

    return { overall, analytics };
  },

  getAllClasses: async () => {
    const q = query(collection(db, "classes"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  enrollInClass: async (studentId, classId) => {
    const docRef = await addDoc(collection(db, "enrollments"), {
      studentId,
      classId,
      enrolledAt: new Date().toISOString()
    });
    return { id: docRef.id, studentId, classId };
  },

  getEnrolledClasses: async (studentId) => {
    const q = query(collection(db, "enrollments"), where("studentId", "==", studentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data().classId);
  }
};
