# SMARTATTEND: Enterprise-Grade University Infrastructure

**SMARTATTEND** is a high-performance, real-time attendance management ecosystem designed to eliminate administrative friction in modern universities.
 It provides a seamless, data-driven bridge between faculty oversight and student transparency.

---

## Features

### Faculty Command Center
- **Workload Management**: Create new course modules or claim existing ones from the global database.
- **Real-Time Roll Call**: Interactive attendance marking with instant cloud synchronization.
- **Defaulter Analytics**: Automated identification of students with <75% attendance for proactive academic intervention.
- **Session Control**: Single-tap "Start Session" and "End & Sync" functionality with live present/absent counters.

### Student Portal
- **Academic Dashboard**: High-density view of "Net Attendance Ratio" and individual course performance.
- **Course Enrollment**: Search the university course directory and enroll in modules with a single click.
- **Risk Assessment**: Visual alerts for "Defaulter Risk" status help students maintain eligibility for assessments.
- **Transparency**: Real-time access to attendance history as recorded by faculty.

---

## Tech Stack

- **Frontend**: Vanilla JavaScript (ESNext), HTML5, CSS3
- **Styling**: Tailwind CSS (Utility-first framework)
- **Icons**: Lucide (High-fidelity vector icons)
- **Backend/Database**: Firebase Firestore (NoSQL, Real-time)
- **Authentication**: Firebase Auth (Identity Platform)
- **Build Tool**: Vite

---

## Project Structure

```text
/
├── src/
│   ├── services/
│   │   ├── authService.js      # User authentication (Login/Signup/Logout)
│   │   ├── facultyService.js   # Faculty workload & class management
│   │   ├── studentService.js   # Student enrollment & personal analytics
│   │   └── attendanceService.js # Firestore attendance transaction logic
│   ├── firebase.js             # Firebase initialization & configuration
│   ├── main.js                 # Central logic, State management, Components & UI
│   └── index.css               # Global styles & Tailwind imports
├── index.html                  # Main entry point
├── package.json                # Project dependencies & scripts
└── metadata.json               # Applet metadata
```

---

## Setup & Installation

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 2. Clone and Install
```bash
# Install dependencies
npm install
```

### 3. Firebase Configuration
The project is pre-configured with a development Firebase project. To use your own:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project and add a Web App.
3. Replace the `firebaseConfig` object in `src/firebase.js` with your own credentials.
4. Enable **Authentication** (Google or Email/Password).
5. Create a **Firestore Database**.

### 4. Running the Project
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Database Schema (Firestore)

- **`users`**: `{ uid, email, name, role }`
- **`classes`**: `{ classId, subjectName, subjectCode, semester, teacherId, createdAt }`
- **`enrollments`**: `{ studentId, classId, enrolledAt }`
- **`attendance`**: `{ studentId, classId, subjectCode, teacherId, status, date, timestamp }`

---

## Security
- **Role-Based Access Control**: Strict separation between Faculty and Student views.
- **Data Integrity**: Attendance records include server-side timestamps for audit trails.
- **Auth Guards**: Navigation is protected by Firebase Auth state listeners.

---

