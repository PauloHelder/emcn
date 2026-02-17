
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ClipboardList,
  Settings,
  Bell,
  UserPlus,
  School as SchoolIcon
} from 'lucide-react';
import {
  MOCK_TEACHERS,
  MOCK_STUDENTS,
  MOCK_DISCIPLINES,
  MOCK_CLASSES,
  INITIAL_ENROLLMENT_SETTINGS,
  COLORS
} from './constants';
import { User, Teacher, Student, Discipline, ClassGroup, EnrollmentSettings, School } from './types';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import TeachersPage from './pages/TeachersPage';
import StudentsPage from './pages/StudentsPage';
import DisciplinesPage from './pages/DisciplinesPage';
import ClassesPage from './pages/ClassesPage';
import EnrollmentPage from './pages/EnrollmentPage';
import EnrollmentsManagementPage from './pages/EnrollmentsManagementPage';
import SchoolsPage from './pages/SchoolsPage';
import UnitsPage from './pages/UnitsPage';
import UsersPage from './pages/UsersPage';
import ConfigPage from './pages/ConfigPage';
import { supabase } from './supabase';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User | null;
  students: Student[];
  handleLogout: () => Promise<void>;
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser, students, handleLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const pendingEnrollmentsCount = students.filter(s => s.status === 'INACTIVE').length;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/inscricoes-gestao', label: 'Inscrições Pendentes', icon: UserPlus, badge: pendingEnrollmentsCount },
    { path: '/professores', label: 'Corpo Docente', icon: GraduationCap },
    { path: '/alunos', label: 'Gestão de Alunos', icon: Users },
    { path: '/disciplinas', label: 'Matriz Curricular', icon: BookOpen },
    { path: '/escolas', label: 'Escolas', icon: SchoolIcon },
    { path: '/usuarios', label: 'Usuários e Perfis', icon: ClipboardList, roles: ['ADMIN', 'SECRETARY'] },
    { path: '/configuracoes', label: 'Configurações', icon: Settings, roles: ['ADMIN'] },
  ];

  const filteredNavItems = navItems.filter(item => !item.roles || (currentUser && item.roles.includes(currentUser.role)));

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-emcn-blue text-white z-50 transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1 overflow-hidden shadow-lg shadow-white/10">
              <img src="https://emcn.com.br/wp-content/uploads/2021/04/cropped-LOGOTIPO-EMCN-1-192x192.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="font-serif text-xl text-emcn-gold tracking-wider font-bold">EMCN</h1>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-2">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200
                  ${location.pathname === item.path ? 'bg-emcn-gold/20 text-emcn-gold border-l-4 border-emcn-gold pl-3' : 'hover:bg-white/5 text-slate-300 hover:text-white'}
                `}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} className={location.pathname === item.path ? 'text-emcn-gold' : ''} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="bg-emcn-gold text-emcn-blue text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="mt-auto flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/20 text-red-300 transition-colors"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-30 shrink-0">
          <button className="lg:hidden text-emcn-blue" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="hidden lg:block text-slate-500 font-medium">
            Escola de Ministros Comunidade Nacional
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-emcn-blue"><Bell size={20} /></button>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold">{currentUser?.name}</div>
                <div className="text-xs text-slate-500 capitalize">{currentUser?.role.toLowerCase()}</div>
              </div>
              <div className="w-9 h-9 bg-emcn-gold rounded-full flex items-center justify-center text-white font-bold">
                {currentUser?.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [enrollmentSettings, setEnrollmentSettings] = useState<EnrollmentSettings>(INITIAL_ENROLLMENT_SETTINGS);

  const fetchAllData = async () => {
    try {
      const [
        { data: teachersData },
        { data: studentsData },
        { data: disciplinesData },
        { data: schoolsData },
        { data: classesData }
      ] = await Promise.all([
        supabase.from('teachers').select('*'),
        supabase.from('students').select('*'),
        supabase.from('disciplines').select('*'),
        supabase.from('schools').select('*'),
        supabase.from('classes').select('*')
      ]);

      if (teachersData) setTeachers(teachersData);
      if (studentsData) {
        setStudents(studentsData.map((s: any) => ({
          ...s,
          enrollmentDate: s.enrollment_date
        })));
      }
      if (disciplinesData) setDisciplines(disciplinesData);
      if (schoolsData) setSchools(schoolsData);
      if (classesData) {
        setClasses(classesData.map((c: any) => ({
          ...c,
          isEnrollmentOpen: c.is_enrollment_open,
          enrollmentDeadline: c.enrollment_deadline,
          enrollmentMessage: c.enrollment_message,
          enrollmentRequirements: c.enrollment_requirements || [],
          schoolId: c.school_id
        })));
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('system_settings').select('*').single();
      if (error) {
        console.warn('Configurações não encontradas ou erro:', error.message);
        return;
      }
      if (data) {
        setEnrollmentSettings({
          isOpen: data.is_open,
          deadline: data.deadline,
          message: data.message
        });
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    }
  };

  useEffect(() => {
    fetchSettings(); // Fetch public settings on mount
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'Usuário',
          email: session.user.email || '',
          role: (session.user.user_metadata.role as any) || 'STUDENT',
        };
        setCurrentUser(user);

        // Enrich in background
        const enrichProfile = async (uid: string) => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', uid)
              .single();

            if (profile) {
              setCurrentUser(prev => prev ? {
                ...prev,
                name: profile.name || prev.name,
                role: profile.role || prev.role,
                avatar: profile.avatar_url || prev.avatar
              } : null);
            }
          } catch (err) {
            console.warn('Initial profile enrichment failed:', err);
          }
        };
        enrichProfile(session.user.id);
      }
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Set basic info immediately to allow login
        const user: User = {
          id: session.user.id,
          name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'Usuário',
          email: session.user.email || '',
          role: (session.user.user_metadata.role as any) || 'STUDENT',
        };
        setCurrentUser(user);

        // Fetch detailed profile in background without blocking
        const enrichProfile = async () => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              setCurrentUser(prev => prev ? {
                ...prev,
                name: profile.name || prev.name,
                role: profile.role || prev.role,
                avatar: profile.avatar_url || prev.avatar
              } : null);
            }
          } catch (err) {
            console.warn('Profile enrichment failed:', err);
          }
        };
        enrichProfile();
      } else {
        setCurrentUser(null);
      }
      // Always fetch data so landing page works for visitors
      fetchAllData();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };



  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage enrollmentSettings={enrollmentSettings} classes={classes} schools={schools} />} />
        <Route path="/unidades" element={<UnitsPage classes={classes} schools={schools} />} />
        <Route path="/login" element={!currentUser ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/inscricao" element={<EnrollmentPage settings={enrollmentSettings} students={students} setStudents={setStudents} classes={classes} schools={schools} />} />
        <Route path="/usuarios" element={currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SECRETARY') ? <Layout currentUser={currentUser} students={students} handleLogout={handleLogout}><UsersPage /></Layout> : <Navigate to="/dashboard" />} />

        {/* Private Routes */}
        <Route path="/dashboard" element={currentUser ? <Layout currentUser={currentUser} students={students} handleLogout={handleLogout}><Dashboard stats={{ teachers, students, disciplines, classes, schools }} /></Layout> : <Navigate to="/login" />} />
        <Route path="/inscricoes-gestao" element={currentUser ? <Layout currentUser={currentUser} students={students} handleLogout={handleLogout}><EnrollmentsManagementPage students={students} setStudents={setStudents} /></Layout> : <Navigate to="/login" />} />
        <Route path="/professores" element={currentUser ? <Layout currentUser={currentUser} students={students} handleLogout={handleLogout}><TeachersPage teachers={teachers} setTeachers={setTeachers} disciplines={disciplines} /></Layout> : <Navigate to="/login" />} />
        <Route path="/alunos" element={currentUser ? <Layout currentUser={currentUser} students={students} handleLogout={handleLogout}><StudentsPage students={students} setStudents={setStudents} /></Layout> : <Navigate to="/login" />} />
        <Route path="/disciplinas" element={currentUser ? <Layout currentUser={currentUser} students={students} handleLogout={handleLogout}><DisciplinesPage disciplines={disciplines} setDisciplines={setDisciplines} /></Layout> : <Navigate to="/login" />} />
        <Route path="/escolas" element={currentUser ? <Layout currentUser={currentUser} students={students} handleLogout={handleLogout}>
          {selectedSchool ? (
            <ClassesPage
              classes={classes.filter(c => c.schoolId === selectedSchool.id)}
              setClasses={setClasses}
              students={students}
              setStudents={setStudents}
              teachers={teachers}
              disciplines={disciplines}
              selectedSchool={selectedSchool}
              onBack={() => setSelectedSchool(null)}
            />
          ) : (
            <SchoolsPage schools={schools} setSchools={setSchools} classes={classes} onSelectSchool={(s) => setSelectedSchool(s)} />
          )}
        </Layout> : <Navigate to="/login" />} />
        <Route path="/configuracoes" element={currentUser && currentUser.role === 'ADMIN' ? <Layout currentUser={currentUser} students={students} handleLogout={handleLogout}><ConfigPage settings={enrollmentSettings} setSettings={setEnrollmentSettings} /></Layout> : <Navigate to="/login" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
