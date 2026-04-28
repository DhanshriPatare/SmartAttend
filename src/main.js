import './index.css';
import { createIcons, LogOut, LayoutDashboard, Rocket, Play, CheckCircle2, Loader2, Users, User, ShieldCheck, ArrowRight, TrendingUp, AlertTriangle, Bell, Mail, Lock, UserPlus, LogIn, BookOpen } from 'lucide';
import { authService } from './services/authService';
import { facultyService } from './services/facultyService';
import { attendanceService } from './services/attendanceService';
import { studentService } from './services/studentService';

// --- State Management ---
let state = {
  user: null, // UserProfile object { uid, email, name, role }
  authLoading: true,
  view: 'landing', // 'landing', 'auth', 'faculty', 'student', 'classes'
  authMode: 'login', // 'login' or 'signup'
  selectedRole: null, // 'faculty' or 'student' (chosen on landing)
  loading: false,
  error: null,
  
  faculty: {
    classes: [],
    allDatabaseClasses: [],
    selectedClass: null,
    students: [],
    defaulters: [], // [{ name, uid, percentage }]
    attendance: {}, // { studentId: 'present' | 'absent' }
    sessionActive: false,
    submitting: false
  },
  
  student: {
    history: [],
    overall: 0,
    analytics: []
  },
  studentViewData: {
    availableClasses: [],
    enrolledIds: []
  }
};

const appElement = document.getElementById('app');

// --- Templates ---

function SidebarTemplate() {
  const { name, role, uid } = state.user || {};
  const roleLabel = role === 'faculty' ? `Faculty (${uid?.slice(0,6)})` : `Student (${uid?.slice(0,6)})`;
  
  return `
    <aside class="w-60 bg-[#0B1120] border-r border-border p-6 flex flex-col h-screen fixed left-0 top-0">
      <div class="flex items-center gap-2 text-accent font-extrabold text-xl tracking-tighter mb-10">
        <i data-lucide="rocket" class="w-6 h-6"></i>
        <span>SMARTATTEND</span>
      </div>

      <nav class="flex-grow space-y-1">
        <div class="nav-item ${state.view === 'faculty' || state.view === 'student' ? 'active' : ''}" data-nav="dashboard">
          <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
          <span>Dashboard</span>
        </div>
        <div class="nav-item ${state.view === 'classes' ? 'active' : ''}" data-nav="classes">
          <i data-lucide="book-open" class="w-4 h-4"></i>
          <span>My Classes</span>
        </div>
      </nav>

      <div class="mt-auto pt-5 border-t border-border">
        <p class="text-[10px] uppercase font-bold tracking-widest text-text-secondary mb-2">Logged in as</p>
        <div class="flex items-center justify-between group">
          <div class="min-w-0">
            <p class="text-sm font-semibold truncate text-text-primary uppercase">${name || 'User'}</p>
            <p class="text-[10px] text-text-secondary uppercase">${roleLabel}</p>
          </div>
          <button id="logout-btn" class="p-2 text-text-secondary hover:text-danger hover:bg-card-bg rounded-lg transition-colors">
            <i data-lucide="log-out" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    </aside>
  `;
}

function LandingTemplate() {
  return `
    <div class="min-h-screen bg-bg flex flex-col items-center justify-center p-8 text-center">
      <div class="bg-accent/10 p-6 rounded-[40px] border border-accent/20 mb-8 glow">
        <i data-lucide="rocket" class="w-16 h-16 text-accent"></i>
      </div>
      <h1 class="text-5xl font-black text-text-primary tracking-tighter mb-4">SMART<span class="text-accent">ATTEND</span></h1>
      <p class="text-text-secondary max-w-md mb-12 flex items-center justify-center gap-2">
        <i data-lucide="shield-check" class="w-4 h-4"></i> 
        Enterprise-grade data infrastructure for universities.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <button id="choose-faculty" class="group bg-card-bg border border-border p-8 rounded-3xl hover:border-accent hover:bg-accent/5 transition-all text-left">
          <div class="bg-accent/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-accent group-hover:scale-110 transition-transform">
            <i data-lucide="users" class="w-6 h-6"></i>
          </div>
          <h3 class="text-xl font-bold text-text-primary mb-2">Faculty Hub</h3>
          <p class="text-sm text-text-secondary mb-6">Manage modules, mark attendance, and generate reports.</p>
          <div class="text-accent flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
            Select Role <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </div>
        </button>

        <button id="choose-student" class="group bg-card-bg border border-border p-8 rounded-3xl hover:border-accent hover:bg-accent/5 transition-all text-left">
          <div class="bg-accent/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-accent group-hover:scale-110 transition-transform">
            <i data-lucide="user" class="w-6 h-6"></i>
          </div>
          <h3 class="text-xl font-bold text-text-primary mb-2">Student Portal</h3>
          <p class="text-sm text-text-secondary mb-6">Track metrics, set goals, and view attendance history.</p>
          <div class="text-accent flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
            Select Role <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </div>
        </button>
      </div>

      <p class="mt-16 text-[10px] uppercase font-black tracking-[0.3em] text-text-secondary opacity-30">V1.0.5 Firebase Integrated</p>
    </div>
  `;
}

function AuthTemplate() {
  const isLogin = state.authMode === 'login';
  return `
    <div class="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
      <div class="w-full max-w-md bg-card-bg border border-border rounded-[32px] p-8 space-y-8 shadow-2xl">
        <div class="text-center space-y-2">
          <div class="bg-accent/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-accent">
            <i data-lucide="${state.selectedRole === 'faculty' ? 'users' : 'user'}" class="w-6 h-6"></i>
          </div>
          <h2 class="text-2xl font-bold text-text-primary tracking-tight">
            ${isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p class="text-sm text-text-secondary uppercase tracking-widest font-bold">
            ${state.selectedRole} Access
          </p>
        </div>

        <form id="auth-form" class="space-y-4">
          ${!isLogin ? `
            <div class="space-y-2">
              <label class="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Full Name</label>
              <div class="relative">
                <i data-lucide="user" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50"></i>
                <input type="text" id="name-input" placeholder="Enter your name" class="input-field pl-12" required>
              </div>
            </div>
          ` : ''}
          
          <div class="space-y-2">
            <label class="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Email Address</label>
            <div class="relative">
              <i data-lucide="mail" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50"></i>
              <input type="email" id="email-input" placeholder="email@university.edu" class="input-field pl-12" required>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Secure Password</label>
            <div class="relative">
              <i data-lucide="lock" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50"></i>
              <input type="password" id="password-input" placeholder="••••••••" class="input-field pl-12" required minlength="6">
            </div>
          </div>

          ${state.error ? `<p class="text-xs text-danger text-center font-semibold bg-danger/5 py-2 rounded-lg border border-danger/10">${state.error}</p>` : ''}

          <button type="submit" id="auth-submit" class="w-full bg-accent text-bg py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:scale-[0.98] transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2" ${state.loading ? 'disabled' : ''}>
            ${state.loading ? '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>' : (isLogin ? '<i data-lucide="log-in" class="w-4 h-4"></i> Login Account' : '<i data-lucide="user-plus" class="w-4 h-4"></i> Create Account')}
          </button>
        </form>

        <div class="text-center pt-4">
          <button id="toggle-auth" class="text-xs font-bold text-text-secondary hover:text-accent transition-colors flex items-center justify-center gap-2 mx-auto">
            ${isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
          <button id="back-to-landing" class="mt-4 text-[10px] font-black uppercase text-text-secondary/40 hover:text-text-secondary tracking-[0.2em] transition-colors underline decoration-2 underline-offset-4">Change Role</button>
        </div>
      </div>
    </div>
  `;
}

function FacultyDashboardTemplate() {
  const f = state.faculty;
  const selClass = f.classes.find(c => c.classId === f.selectedClass);
  const presentCount = Object.values(f.attendance).filter(s => s === 'present').length;
  const absentCount = f.students.length - presentCount;

  return `
    <div class="flex min-h-screen">
      ${SidebarTemplate()}
      <main class="flex-grow ml-60 p-8 bg-bg">
        <header class="flex justify-between items-end mb-8">
          <div class="space-y-1">
            <p class="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">
              ${f.selectedClass ? selClass.semester : "SELECT CLASS"}
            </p>
            <h1 class="text-2xl font-bold text-text-primary tracking-tight">
              ${f.selectedClass ? selClass.subjectName : "Faculty Hub"}
            </h1>
          </div>

          ${f.sessionActive ? `
            <div class="bg-card-bg border border-accent rounded-2xl px-6 py-4 flex items-center gap-6 glow">
              <div class="space-y-0.5">
                <span class="block text-[10px] font-bold text-accent uppercase tracking-widest leading-none">Session Active</span>
                <span class="font-mono text-xl font-bold text-text-primary tabular-nums">LIVE</span>
              </div>
              <div class="w-px h-8 bg-border"></div>
              <div class="text-accent text-xs font-bold whitespace-nowrap">
                ${presentCount}/${f.students.length} Markable
              </div>
            </div>
          ` : ''}
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-8">
          <div class="space-y-8">
            <div class="bg-card-bg border border-border rounded-2xl p-3 flex gap-2 overflow-x-auto no-scrollbar">
              ${f.classes.map(cls => `
                <button data-class-id="${cls.classId}" class="class-tab px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  f.selectedClass === cls.classId 
                    ? 'bg-accent text-bg shadow-lg shadow-accent/20' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-border/30'
                }">
                  ${cls.subjectCode}
                </button>
              `).join('')}
              ${f.classes.length === 0 ? '<p class="text-xs text-text-secondary italic p-2">No classes assigned yet.</p>' : ''}
            </div>

            <div class="bg-card-bg border border-border rounded-2xl flex flex-col overflow-hidden">
              <div class="p-5 border-b border-border flex justify-between items-center bg-[#1e293b80]">
                <h2 class="text-sm font-bold uppercase tracking-wider text-text-primary">Student Roll Call</h2>
                <span class="text-[10px] text-text-secondary font-mono">${f.students.length} Enrolled</span>
              </div>
              
              <div class="max-h-[500px] overflow-y-auto no-scrollbar">
                <table class="w-full">
                  <thead class="sticky top-0 bg-[#0F172A] z-10">
                    <tr class="text-[10px] text-text-secondary font-bold uppercase tracking-widest border-b border-border">
                      <th class="px-6 py-4 text-left font-medium">Roll ID</th>
                      <th class="px-6 py-4 text-left font-medium">Name</th>
                      <th class="px-6 py-4 text-right font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border">
                    ${f.students.map(s => `
                      <tr class="hover:bg-accent/5 transition-colors">
                        <td class="px-6 py-4 font-mono text-xs text-text-secondary">${s.uid?.slice(-8) || s.studentId}</td>
                        <td class="px-6 py-4 text-sm font-semibold">${s.name}</td>
                        <td class="px-6 py-4 text-right">
                          <button 
                            data-student-id="${s.uid}"
                            ${!f.sessionActive ? 'disabled' : ''}
                            class="attendance-toggle px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all ${
                              f.attendance[s.uid] === 'present'
                                ? 'bg-success/10 text-success border-success shadow-sm shadow-success/10'
                                : 'bg-danger/10 text-danger border-danger/30'
                            } disabled:opacity-20"
                          >
                            ${f.attendance[s.uid] === 'present' ? 'PRESENT' : 'ABSENT'}
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                    ${f.students.length === 0 ? `
                      <tr>
                        <td colspan="3" class="px-6 py-20 text-center text-text-secondary/30 italic text-sm">
                          ${state.loading ? 'Updating student list...' : 'Select a class to load roll call...'}
                        </td>
                      </tr>
                    ` : ''}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="space-y-6 flex flex-col">
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-card-bg p-5 rounded-2xl border border-border space-y-2">
                <p class="text-[10px] font-bold text-text-secondary uppercase">Present</p>
                <p class="text-3xl font-bold text-success tabular-nums">${presentCount}</p>
              </div>
              <div class="bg-card-bg p-5 rounded-2xl border border-border space-y-2">
                <p class="text-[10px] font-bold text-text-secondary uppercase">Absent</p>
                <p class="text-3xl font-bold text-danger tabular-nums">${absentCount}</p>
              </div>
              <div class="bg-card-bg p-5 rounded-2xl border border-border space-y-2">
                <p class="text-[10px] font-bold text-text-secondary uppercase">Ratio</p>
                <p class="text-3xl font-bold text-accent tabular-nums">${f.students.length > 0 ? Math.round((presentCount/f.students.length)*100) : 0}%</p>
              </div>
            </div>

            <div class="bg-card-bg border border-border rounded-2xl flex flex-col flex-grow overflow-hidden">
               <div class="p-5 border-b border-border flex justify-between items-center bg-[#1e293b80]">
                <h2 class="text-sm font-bold uppercase tracking-wider">Quick Actions</h2>
              </div>
              <div class="p-8 flex flex-col items-center justify-center flex-grow text-center space-y-4">
                <div class="p-4 bg-accent/5 rounded-full border border-accent/10 mb-4">
                  <i data-lucide="${f.sessionActive ? 'loader-2' : 'play'}" class="w-10 h-10 text-accent ${f.sessionActive ? 'animate-spin' : ''}"></i>
                </div>
                <h3 class="font-bold text-text-primary">${f.sessionActive ? 'Recording Live Data' : 'Session Ready'}</h3>
                <p class="text-xs text-text-secondary max-w-[200px]">Attendance will be synchronized to the cloud in real-time.</p>
              </div>

              <div class="p-5 bg-card-bg mt-auto border-t border-border">
                ${!f.sessionActive ? `
                  <button id="start-session-btn" ${!f.selectedClass || state.loading ? 'disabled' : ''} class="w-full bg-accent text-bg px-6 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale shadow-lg shadow-accent/20 flex items-center justify-center gap-3">
                    <i data-lucide="play" class="w-5 h-5 fill-current"></i> Start Session
                  </button>
                ` : `
                  <button id="submit-attendance-btn" ${f.submitting ? 'disabled' : ''} class="w-full bg-success text-bg px-6 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-3 shadow-lg shadow-success/20">
                    ${f.submitting ? '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>' : '<i data-lucide="check-circle-2" class="w-5 h-5"></i> End & Sync Session'}
                  </button>
                `}
              </div>
            </div>

            <div class="bg-card-bg border border-border rounded-2xl flex flex-col overflow-hidden">
               <div class="p-5 border-b border-border flex justify-between items-center bg-[#1e293b80]">
                <h2 class="text-xs font-bold uppercase tracking-wider text-danger">Defaulter List (< 75%)</h2>
                <i data-lucide="alert-triangle" class="w-4 h-4 text-danger animate-pulse"></i>
              </div>
              <div class="max-h-[300px] overflow-y-auto no-scrollbar">
                <table class="w-full text-[11px]">
                  <tbody class="divide-y divide-border">
                    ${f.defaulters.map(d => `
                      <tr class="hover:bg-danger/5 transition-colors">
                        <td class="px-4 py-3 font-semibold text-text-primary">${d.name}</td>
                        <td class="px-4 py-3 text-right font-mono text-danger font-bold">${d.percentage}%</td>
                      </tr>
                    `).join('')}
                    ${f.defaulters.length === 0 ? `
                      <tr>
                        <td class="px-4 py-10 text-center text-text-secondary/30 italic">
                          ${f.selectedClass ? 'No defaulters found in this module.' : 'Select a class to view metrics.'}
                        </td>
                      </tr>
                    ` : ''}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
}
function StudentDashboardTemplate() {
  const { analytics, overall, history } = state.student;
  const isLow = overall < 75;
  let totalPresent = 0, totalClasses = 0, totalNeeded = 0, totalCanMiss = 0;
  analytics.forEach(s => { totalPresent += s.present||0; totalClasses += s.total||0; totalNeeded += s.classesNeeded||0; totalCanMiss += s.canMiss||0; });

  return `
    <div class="flex min-h-screen">
      ${SidebarTemplate()}
      <main class="flex-grow ml-60 p-8 bg-bg">
        <header class="flex justify-between items-end mb-8">
          <div class="space-y-1">
            <p class="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">Academic Analytics</p>
            <h1 class="text-2xl font-bold text-text-primary tracking-tight">Personal Portal</h1>
          </div>
          <div class="flex items-center gap-4">
            <button id="export-attendance-btn" class="bg-card-bg border border-border px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:border-accent transition-all flex items-center gap-2">
              <i data-lucide="download" class="w-3 h-3"></i> Export CSV
            </button>
            <div class="bg-card-bg border border-border rounded-2xl px-6 py-4 flex items-center gap-6">
              <div class="space-y-0.5">
                <span class="block text-[10px] font-bold text-text-secondary uppercase tracking-widest leading-none">Net Ratio</span>
                <span class="font-mono text-xl font-bold tabular-nums ${isLow ? 'text-danger' : 'text-accent'}">${overall}%</span>
              </div>
              <div class="w-px h-8 bg-border"></div>
              <div class="text-xs font-bold whitespace-nowrap px-3 py-1 rounded-lg ${isLow ? 'bg-danger/10 text-danger ring-1 ring-danger/20' : 'bg-success/10 text-success'}">
                ${isLow ? 'DEFAULTER RISK' : 'OPTIMAL'}
              </div>
            </div>
          </div>
        </header>

        ${totalNeeded > 0 ? `
          <div class="bg-danger/5 border border-danger/20 rounded-2xl p-4 flex items-start gap-3 mb-6">
            <i data-lucide="alert-triangle" class="w-5 h-5 text-danger flex-shrink-0 mt-0.5"></i>
            <div><p class="text-sm font-bold text-danger mb-1">Attendance Alert</p><p class="text-xs text-text-secondary">You need to attend <span class="text-danger font-bold">${totalNeeded} more class${totalNeeded>1?'es':''}</span> to maintain 75% attendance.</p></div>
          </div>
        ` : totalCanMiss > 0 ? `
          <div class="bg-success/5 border border-success/20 rounded-2xl p-4 flex items-start gap-3 mb-6">
            <i data-lucide="check-circle-2" class="w-5 h-5 text-success flex-shrink-0 mt-0.5"></i>
            <div><p class="text-sm font-bold text-success mb-1">Good Standing</p><p class="text-xs text-text-secondary">You can safely miss up to <span class="text-success font-bold">${totalCanMiss} class${totalCanMiss>1?'es':''}</span>.</p></div>
          </div>
        ` : ''}

        <div class="grid grid-cols-4 gap-4 mb-8">
          <div class="bg-card-bg border border-border p-5 rounded-2xl space-y-2"><p class="text-[10px] font-bold text-text-secondary uppercase">Present</p><p class="text-3xl font-bold text-success tabular-nums">${totalPresent}</p></div>
          <div class="bg-card-bg border border-border p-5 rounded-2xl space-y-2"><p class="text-[10px] font-bold text-text-secondary uppercase">Total</p><p class="text-3xl font-bold text-accent tabular-nums">${totalClasses}</p></div>
          <div class="bg-card-bg border border-border p-5 rounded-2xl space-y-2"><p class="text-[10px] font-bold text-text-secondary uppercase">Needed</p><p class="text-3xl font-bold ${totalNeeded>0?'text-danger':'text-success'} tabular-nums">${totalNeeded}</p></div>
          <div class="bg-card-bg border border-border p-5 rounded-2xl space-y-2"><p class="text-[10px] font-bold text-text-secondary uppercase">Can Miss</p><p class="text-3xl font-bold text-success tabular-nums">${totalCanMiss}</p></div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-8">
          <div class="space-y-6">
             <div class="bg-card-bg border border-border rounded-2xl p-6 space-y-4">
              <div class="flex items-center gap-3"><i data-lucide="trending-up" class="text-accent w-4 h-4"></i><h3 class="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Classes to Attend</h3></div>
              <div class="space-y-3">
                ${analytics.length === 0 ? '<p class="text-[11px] text-text-secondary italic">No enrollment data found.</p>' : ''}
                ${analytics.map(stats => `
                  <div class="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div><p class="text-xs font-bold text-text-primary">${stats.subjectName}</p><p class="text-[10px] text-text-secondary">${stats.subjectCode} • ${stats.present||0}/${stats.total||0} attended</p></div>
                    ${(stats.classesNeeded||0) > 0 ? `<span class="text-xs font-bold text-danger bg-danger/10 px-3 py-1 rounded-lg whitespace-nowrap">Attend ${stats.classesNeeded} more</span>` : (stats.canMiss||0) > 0 ? `<span class="text-xs font-bold text-success bg-success/10 px-3 py-1 rounded-lg whitespace-nowrap">Can skip ${stats.canMiss}</span>` : (stats.total||0) > 0 ? `<span class="text-xs font-bold text-accent bg-accent/10 px-3 py-1 rounded-lg whitespace-nowrap">On Track</span>` : `<span class="text-xs font-bold text-text-secondary bg-border/10 px-3 py-1 rounded-lg whitespace-nowrap">No Data</span>`}
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="bg-card-bg border border-border rounded-2xl p-6 space-y-4">
              <div class="flex items-center gap-3"><i data-lucide="calendar" class="text-accent w-4 h-4"></i><h3 class="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Last 7 Days</h3></div>
              <div class="space-y-2">
                ${(history||[]).length === 0 ? '<p class="text-[11px] text-text-secondary italic">No history data available.</p>' : ''}
                ${(history||[]).map(day => `
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="text-text-secondary font-medium">${day.date}</span>
                    <div class="flex items-center gap-2">
                      <div class="h-1.5 w-24 bg-border rounded-full overflow-hidden"><div class="h-full ${day.total>0&&(day.present/day.total)*100>=75?'bg-success':'bg-danger'}" style="width: ${day.total>0?(day.present/day.total)*100:0}%"></div></div>
                      <span class="text-text-secondary font-mono">${day.present}/${day.total}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="bg-card-bg border border-border rounded-2xl overflow-hidden">
            <div class="p-5 border-b border-border flex justify-between items-center bg-[#1e293b80]"><h2 class="text-sm font-bold uppercase tracking-wider">Course Performance</h2><span class="text-[10px] font-bold text-accent px-2 py-0.5 rounded bg-accent/10">${analytics.length} Active</span></div>
            <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              ${analytics.length === 0 ? '<p class="text-sm text-text-secondary text-center col-span-2 py-20 italic">No enrollment data found.</p>' : ''}
              ${analytics.map(stats => `
                <div class="bg-bg border border-border p-5 rounded-2xl space-y-4 hover:border-accent/40 transition-colors group">
                  <div class="flex justify-between items-start"><h4 class="text-xs font-bold text-text-secondary uppercase tracking-widest leading-tight line-clamp-1">${stats.subjectName}</h4>${stats.percentage < 75 ? '<i data-lucide="alert-triangle" class="w-3 h-3 text-danger"></i>' : '<div class="w-1.5 h-1.5 rounded-full bg-success glow"></div>'}</div>
                  <div class="flex items-baseline gap-2"><span class="text-3xl font-bold tabular-nums italic ${stats.percentage < 75 ? 'text-danger' : 'text-text-primary'}">${stats.percentage}</span><span class="text-[10px] font-bold text-text-secondary">% Ratio</span></div>
                  <div class="border-t border-border pt-3">${(stats.classesNeeded||0)>0?`<p class="text-[10px] font-bold text-danger">Need ${stats.classesNeeded} more</p>`:(stats.canMiss||0)>0?`<p class="text-[10px] font-bold text-success">Can miss ${stats.canMiss}</p>`:(stats.total||0)>0?`<p class="text-[10px] font-bold text-accent">Maintain attendance</p>`:`<p class="text-[10px] font-bold text-text-secondary">No records yet</p>`}</div>
                  <div class="space-y-1.5"><div class="h-1 w-full bg-border rounded-full overflow-hidden"><div class="h-full ${stats.percentage < 75 ? 'bg-danger' : 'bg-accent'}" style="width: ${stats.percentage}%"></div></div><div class="flex justify-between text-[9px] font-mono text-text-secondary uppercase tracking-tighter"><span>${stats.present} Present / ${stats.total} Total</span></div></div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
}
function FacultyClassesTemplate() {
  const f = state.faculty;
  const myClassIds = f.classes.map(c => c.id);
  const otherClasses = f.allDatabaseClasses.filter(c => !myClassIds.includes(c.id));

  return `
    <div class="flex min-h-screen">
      ${SidebarTemplate()}
      <main class="flex-grow ml-60 p-8 bg-bg">
        <header class="mb-8 flex justify-between items-end">
          <div class="space-y-1">
            <p class="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">Curriculum Management</p>
            <h1 class="text-2xl font-bold text-text-primary tracking-tight">Workload & Modules</h1>
          </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-8">
          <div class="space-y-6">
            <div class="bg-card-bg border border-border rounded-3xl p-6 space-y-6">
              <h3 class="text-sm font-bold uppercase tracking-wider text-text-primary">Create New Module</h3>
              <p class="text-[10px] text-text-secondary font-bold uppercase leading-relaxed">For subjects that do not exist in the database yet.</p>
              <form id="create-class-form" class="space-y-4">
                <div class="space-y-2">
                  <label class="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Subject Name</label>
                  <input type="text" id="subject-name" placeholder="e.g. Artificial Intelligence" class="input-field" required>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Subject Code</label>
                  <input type="text" id="subject-code" placeholder="e.g. AI404" class="input-field" required>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Semester</label>
                  <input type="text" id="semester" placeholder="e.g. SEM VIII" class="input-field" required>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Logical Class ID</label>
                  <input type="text" id="class-id" placeholder="e.g. UC404" class="input-field" required>
                </div>
                <button type="submit" class="w-full bg-accent text-bg py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  <i data-lucide="rocket" class="w-4 h-4"></i> Deploy New Subject
                </button>
              </form>
            </div>
          </div>

          <div class="space-y-8">
            <div class="bg-card-bg border border-border rounded-3xl overflow-hidden">
              <div class="p-5 border-b border-border bg-[#1e293b80] flex justify-between items-center">
                <h3 class="text-sm font-bold uppercase tracking-wider text-text-primary">Your Assigned Workload</h3>
                <span class="text-[10px] text-accent font-mono font-bold uppercase">${f.classes.length} Modules</span>
              </div>
              <div class="p-6">
                <div class="grid grid-cols-1 gap-4">
                  ${f.classes.map(cls => `
                    <div class="bg-bg border border-border p-5 rounded-2xl flex justify-between items-center group hover:border-accent/40 transition-colors">
                      <div class="space-y-1">
                        <div class="flex items-center gap-2">
                          <span class="text-[10px] font-bold text-accent px-2 py-0.5 rounded bg-accent/10">${cls.classId}</span>
                          <h4 class="text-sm font-bold text-text-primary">${cls.subjectName}</h4>
                        </div>
                        <p class="text-[10px] text-text-secondary uppercase font-bold tracking-widest">${cls.subjectCode} • ${cls.semester}</p>
                      </div>
                      <div class="flex items-center gap-3">
                         <div class="w-2 h-2 rounded-full bg-success glow"></div>
                         <span class="text-[10px] font-bold text-success uppercase tracking-widest">Active</span>
                      </div>
                    </div>
                  `).join('')}
                  ${f.classes.length === 0 ? '<p class="text-sm text-text-secondary text-center py-10 italic">No modules assigned yet.</p>' : ''}
                </div>
              </div>
            </div>

            <div class="bg-card-bg border border-border rounded-3xl overflow-hidden">
              <div class="p-5 border-b border-border bg-[#1e293b80] flex justify-between items-center">
                <h3 class="text-sm font-bold uppercase tracking-wider text-text-primary">Database Exploration</h3>
                <span class="text-[10px] text-text-secondary font-mono font-bold uppercase">Choose Existing</span>
              </div>
              <div class="p-6">
                <div class="grid grid-cols-1 gap-4">
                  ${otherClasses.map(cls => `
                    <div class="bg-bg border border-border p-5 rounded-2xl flex justify-between items-center group hover:border-accent/40 transition-colors">
                      <div class="space-y-1">
                        <div class="flex items-center gap-2">
                          <span class="text-[10px] font-bold text-text-secondary px-2 py-0.5 rounded bg-border/40">${cls.classId}</span>
                          <h4 class="text-sm font-bold text-text-primary">${cls.subjectName}</h4>
                        </div>
                        <p class="text-[10px] text-text-secondary uppercase font-bold tracking-widest">${cls.subjectCode} • ${cls.semester}</p>
                      </div>
                      <button data-claim-id="${cls.id}" class="bg-accent/10 border border-accent/20 text-accent px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-bg transition-all">
                        Assign Self
                      </button>
                    </div>
                  `).join('')}
                  ${otherClasses.length === 0 ? '<p class="text-sm text-text-secondary text-center py-10 italic">All database modules are already in your workload.</p>' : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
}

function StudentClassesTemplate() {
  const { availableClasses = [], enrolledIds = [] } = state.studentViewData || {};
  return `
    <div class="flex min-h-screen">
      ${SidebarTemplate()}
      <main class="flex-grow ml-60 p-8 bg-bg">
        <header class="mb-8">
          <div class="space-y-1">
            <p class="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">Enrollment Portal</p>
            <h1 class="text-2xl font-bold text-text-primary tracking-tight">Course Directory</h1>
          </div>
        </header>

        <div class="bg-card-bg border border-border rounded-3xl overflow-hidden">
          <div class="p-5 border-b border-border bg-[#1e293b80] flex justify-between items-center">
            <h3 class="text-sm font-bold uppercase tracking-wider text-text-primary">Available Modules</h3>
            <span class="text-[10px] text-text-secondary font-mono">${availableClasses.length} Modules Online</span>
          </div>
          <div class="p-8">
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              ${availableClasses.map(cls => {
                const isEnrolled = enrolledIds.includes(cls.classId);
                return `
                  <div class="bg-bg border border-border p-6 rounded-[32px] space-y-6 flex flex-col hover:border-accent/30 transition-all group">
                    <div class="flex justify-between items-start">
                      <div class="bg-accent/10 p-3 rounded-2xl text-accent group-hover:scale-110 transition-transform">
                        <i data-lucide="rocket" class="w-6 h-6"></i>
                      </div>
                      <span class="text-[10px] font-black text-text-secondary/50 uppercase tracking-[0.2em]">${cls.semester}</span>
                    </div>
                    
                    <div class="space-y-1">
                      <h4 class="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">${cls.subjectName}</h4>
                      <p class="text-[10px] font-bold text-text-secondary uppercase tracking-widest">${cls.subjectCode} • ${cls.classId}</p>
                    </div>

                    <div class="pt-4 mt-auto">
                      <button 
                        data-enroll-id="${cls.classId}"
                        ${isEnrolled ? 'disabled' : ''}
                        class="w-full ${isEnrolled ? 'bg-success/10 text-success border border-success/30 cursor-default' : 'bg-accent text-bg hover:scale-[0.98]'} py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        ${isEnrolled ? '<i data-lucide="check-circle-2" class="w-4 h-4"></i> Registered' : '<i data-lucide="user-plus" class="w-4 h-4"></i> Enroll Now'}
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
              ${availableClasses.length === 0 ? '<p class="text-sm text-text-secondary text-center col-span-full py-20 italic">No available courses found.</p>' : ''}
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
}

// --- Render Logic ---

function render() {
  if (state.authLoading) {
    appElement.innerHTML = `
      <div class="min-h-screen bg-bg flex items-center justify-center">
        <div class="text-center space-y-4">
          <i data-lucide="loader-2" class="w-10 h-10 text-accent animate-spin mx-auto"></i>
          <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary">Initalizing Core</p>
        </div>
      </div>
    `;
  } else if (!state.user) {
    if (state.view === 'landing') {
      appElement.innerHTML = LandingTemplate();
    } else {
      appElement.innerHTML = AuthTemplate();
    }
  } else {
    // Authenticated
    if (state.view === 'classes') {
      if (state.user.role === 'faculty') {
        appElement.innerHTML = FacultyClassesTemplate();
      } else {
        appElement.innerHTML = StudentClassesTemplate();
      }
    } else {
      if (state.user.role === 'faculty') {
        appElement.innerHTML = FacultyDashboardTemplate();
      } else {
        appElement.innerHTML = StudentDashboardTemplate();
      }
    }
  }
  
  createIcons({
    icons: { LogOut, LayoutDashboard, Rocket, Play, CheckCircle2, Loader2, Users, User, ShieldCheck, ArrowRight, TrendingUp, AlertTriangle, Bell, Mail, Lock, UserPlus, LogIn, BookOpen }
  });

  attachEventListeners();
}

// --- Controller Logic ---

async function fetchFacultyData() {
  if (!state.user || state.user.role !== 'faculty') return;
  state.loading = true;
  try {
    const classes = await facultyService.getAssignedClasses(state.user.uid);
    state.faculty.classes = classes;
    render();
  } catch (err) {
    console.error(err);
  } finally {
    state.loading = false;
    render();
  }
}

async function updateDefaulterList(classId, students) {
  try {
    const attendanceRecords = await attendanceService.getClassAttendance(classId);
    const defaulters = [];

    students.forEach(student => {
      const studentAttendance = attendanceRecords.filter(r => r.studentId === student.uid);
      const total = studentAttendance.length;
      if (total === 0) return; // Haven't attended any sessions yet or none recorded

      const present = studentAttendance.filter(r => r.status === 'present').length;
      const percentage = Math.round((present / total) * 100);

      if (percentage < 75) {
        defaulters.push({
          name: student.name,
          uid: student.uid,
          percentage
        });
      }
    });

    state.faculty.defaulters = defaulters.sort((a, b) => a.percentage - b.percentage);
  } catch (err) {
    console.error("Defaulter calculation error", err);
  }
}

async function fetchFacultyClassesData() {
  if (!state.user || state.user.role !== 'faculty') return;
  state.loading = true;
  render();
  try {
    const all = await facultyService.getAllClasses();
    state.faculty.allDatabaseClasses = all;
  } catch (err) {
    console.error(err);
  } finally {
    state.loading = false;
    render();
  }
}

async function fetchStudentAnalytics() {
  if (!state.user || state.user.role !== 'student') return;
  state.loading = true;
  try {
    const { overall, analytics, history } = await studentService.getStudentAnalytics(state.user.uid);
    state.student.overall = overall;
    state.student.analytics = analytics;
    state.student.history = history || [];
    render();
  } catch (err) {
    console.error(err);
  } finally {
    state.loading = false;
    render();
  }
}

async function fetchStudentClassesData() {
  if (!state.user || state.user.role !== 'student') return;
  state.loading = true;
  render();
  try {
    const all = await studentService.getAllClasses();
    const enrolledIds = await studentService.getEnrolledClasses(state.user.uid);
    state.studentViewData.availableClasses = all;
    state.studentViewData.enrolledIds = enrolledIds;
  } catch (err) {
    console.error(err);
  } finally {
    state.loading = false;
    render();
  }
}

function attachEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', async () => {
      const nav = item.getAttribute('data-nav');
      if (nav === 'dashboard') {
        state.view = state.user.role === 'faculty' ? 'faculty' : 'student';
      } else {
        state.view = nav;
        if (state.view === 'classes') {
          if (state.user.role === 'student') await fetchStudentClassesData();
          if (state.user.role === 'faculty') await fetchFacultyClassesData();
        }
      }
      render();
    });
  });

  // Landing Actions
  document.getElementById('choose-faculty')?.addEventListener('click', () => {
    state.selectedRole = 'faculty';
    state.view = 'auth';
    state.authMode = 'login';
    render();
  });
  document.getElementById('choose-student')?.addEventListener('click', () => {
    state.selectedRole = 'student';
    state.view = 'auth';
    state.authMode = 'login';
    render();
  });

  // Auth Actions
  document.getElementById('toggle-auth')?.addEventListener('click', () => {
    state.authMode = state.authMode === 'login' ? 'signup' : 'login';
    state.error = null;
    render();
  });
  document.getElementById('back-to-landing')?.addEventListener('click', () => {
    state.view = 'landing';
    state.selectedRole = null;
    state.error = null;
    render();
  });

  document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email-input').value;
    const pass = document.getElementById('password-input').value;
    const name = document.getElementById('name-input')?.value;

    state.loading = true;
    state.error = null;
    render();

    try {
      if (state.authMode === 'login') {
        const profile = await authService.login(email, pass);
        // Correct role check
        if (profile.role !== state.selectedRole) {
           await authService.logout();
           throw new Error(`Account is registered as ${profile.role}, not ${state.selectedRole}.`);
        }
      } else {
        await authService.signUp(email, pass, name, state.selectedRole);
      }
    } catch (err) {
      state.error = err.message;
    } finally {
      state.loading = false;
      render();
    }
  });

  // Faculty Classes Actions
  document.getElementById('create-class-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    state.loading = true;
    render();
    try {
      const classData = {
        subjectName: document.getElementById('subject-name').value,
        subjectCode: document.getElementById('subject-code').value,
        semester: document.getElementById('semester').value,
        classId: document.getElementById('class-id').value
      };
      await facultyService.createClass(state.user.uid, classData);
      await fetchFacultyData(); // Refresh personal workload
      await fetchFacultyClassesData(); // Refresh global DB list
      alert("Class deployed successfully!");
    } catch (err) {
      alert("Error creating class: " + err.message);
    } finally {
      state.loading = false;
      render();
    }
  });

  document.querySelectorAll('[data-claim-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const classDocId = btn.getAttribute('data-claim-id');
      state.loading = true;
      render();
      try {
        await facultyService.claimClass(state.user.uid, classDocId);
        await fetchFacultyData();
        await fetchFacultyClassesData();
        alert("Class assigned to your workload!");
      } catch (err) {
        alert("Assignment failed: " + err.message);
      } finally {
        state.loading = false;
        render();
      }
    });
  });

  // Student Enrollment Actions
  document.querySelectorAll('[data-enroll-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const classId = btn.getAttribute('data-enroll-id');
      state.loading = true;
      render();
      try {
        await studentService.enrollInClass(state.user.uid, classId);
        await fetchStudentClassesData(); // Refresh list
        await fetchStudentAnalytics(); // Update dashboard too
        alert("Enrolled successfully!");
      } catch (err) {
        alert("Enrollment failed: " + err.message);
      } finally {
        state.loading = false;
        render();
      }
    });
  });

  // Sidebar Actions
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await authService.logout();
    state.user = null;
    state.view = 'landing';
    render();
  });

  // Faculty Specific
  document.querySelectorAll('.class-tab').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (state.faculty.sessionActive) return;
      const classId = btn.getAttribute('data-class-id');
      state.faculty.selectedClass = classId;
      state.loading = true;
      render();
      try {
        const students = await facultyService.getEnrolledStudents(classId);
        state.faculty.students = students;
        state.faculty.attendance = {};
        students.forEach(s => state.faculty.attendance[s.uid] = 'absent');
        await updateDefaulterList(classId, students);
      } catch (err) {
        console.error(err);
      } finally {
        state.loading = false;
        render();
      }
    });
  });

  document.querySelectorAll('.attendance-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-student-id');
      state.faculty.attendance[id] = state.faculty.attendance[id] === 'present' ? 'absent' : 'present';
      render();
    });
  });

  document.getElementById('start-session-btn')?.addEventListener('click', () => {
    state.faculty.sessionActive = true;
    render();
  });

  document.getElementById('submit-attendance-btn')?.addEventListener('click', async () => {
    state.faculty.submitting = true;
    render();
    try {
      const selClass = state.faculty.classes.find(c => c.classId === state.faculty.selectedClass);
      const records = state.faculty.students.map(s => ({
        studentId: s.uid,
        classId: state.faculty.selectedClass,
        subjectCode: selClass.subjectCode,
        teacherId: state.user.uid,
        status: state.faculty.attendance[s.uid]
      }));
      await attendanceService.submitAttendance(records);
      state.faculty.sessionActive = false;
      await updateDefaulterList(state.faculty.selectedClass, state.faculty.students);
      alert("Attendance records committed to Firestore.");
    } catch (err) {
      alert("Submission error: " + err.message);
    } finally {
      state.faculty.submitting = false;
      render();
    }
  });
}

// --- Initialization ---

authService.onAuthChange(async (firebaseUser) => {
  if (firebaseUser) {
    try {
      const profile = await authService.getUserProfile(firebaseUser.uid);
      state.user = profile;
      if (profile.role === 'faculty') {
        await fetchFacultyData();
      } else {
        await fetchStudentAnalytics();
      }
    } catch (err) {
      console.error("Profile fetch error", err);
    }
  } else {
    state.user = null;
  }
  state.authLoading = false;
  render();
});
