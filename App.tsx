
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
  UserPlus
} from 'lucide-react';
import {
  MOCK_TEACHERS,
  MOCK_STUDENTS,
  MOCK_DISCIPLINES,
  MOCK_CLASSES,
  INITIAL_ENROLLMENT_SETTINGS,
  COLORS
} from './constants';
import { User, Teacher, Student, Discipline, ClassGroup, EnrollmentSettings } from './types';

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
import { supabase } from './supabase';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [enrollmentSettings, setEnrollmentSettings] = useState<EnrollmentSettings>(INITIAL_ENROLLMENT_SETTINGS);

  const fetchAllData = async () => {
    try {
      const [
        { data: teachersData },
        { data: studentsData },
        { data: disciplinesData },
        { data: classesData }
      ] = await Promise.all([
        supabase.from('teachers').select('*'),
        supabase.from('students').select('*'),
        supabase.from('disciplines').select('*'),
        supabase.from('classes').select('*')
      ]);

      if (teachersData) setTeachers(teachersData);
      if (studentsData) setStudents(studentsData);
      if (disciplinesData) setDisciplines(disciplinesData);
      if (classesData) setClasses(classesData);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  useEffect(() => {
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
      }
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'Usuário',
          email: session.user.email || '',
          role: (session.user.user_metadata.role as any) || 'STUDENT',
        };
        setCurrentUser(user);
        fetchAllData(); // Fetch real data when user logs in
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const pendingEnrollmentsCount = students.filter(s => s.status === 'INACTIVE').length;

    const navItems = [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/inscricoes-gestao', label: 'Novas Inscrições', icon: UserPlus, badge: pendingEnrollmentsCount },
      { path: '/professores', label: 'Professores', icon: GraduationCap },
      { path: '/alunos', label: 'Alunos', icon: Users },
      { path: '/disciplinas', label: 'Disciplinas', icon: BookOpen },
      { path: '/turmas', label: 'Turmas', icon: Layers },
      { path: '/configuracoes', label: 'Configurações', icon: Settings },
    ];

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
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1 overflow-hidden">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="font-serif text-xl text-emcn-gold tracking-wider">EMCN</h1>
            </div>

            <nav className="flex-1 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center justify-between px-4 py-3 rounded-lg transition-colors
                    ${location.pathname === item.path ? 'bg-emcn-gold/20 text-emcn-gold' : 'hover:bg-white/5'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="bg-emcn-gold text-emcn-blue text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
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

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage enrollmentSettings={enrollmentSettings} />} />
        <Route path="/login" element={!currentUser ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/inscricao" element={<EnrollmentPage settings={enrollmentSettings} students={students} setStudents={setStudents} />} />

        {/* Private Routes */}
        <Route path="/dashboard" element={currentUser ? <Layout><Dashboard stats={{ teachers, students, disciplines, classes }} /></Layout> : <Navigate to="/login" />} />
        <Route path="/inscricoes-gestao" element={currentUser ? <Layout><EnrollmentsManagementPage students={students} setStudents={setStudents} /></Layout> : <Navigate to="/login" />} />
        <Route path="/professores" element={currentUser ? <Layout><TeachersPage teachers={teachers} setTeachers={setTeachers} /></Layout> : <Navigate to="/login" />} />
        <Route path="/alunos" element={currentUser ? <Layout><StudentsPage students={students} setStudents={setStudents} /></Layout> : <Navigate to="/login" />} />
        <Route path="/disciplinas" element={currentUser ? <Layout><DisciplinesPage disciplines={disciplines} setDisciplines={setDisciplines} /></Layout> : <Navigate to="/login" />} />
        <Route path="/turmas" element={currentUser ? <Layout><ClassesPage classes={classes} setClasses={setClasses} students={students} teachers={teachers} disciplines={disciplines} /></Layout> : <Navigate to="/login" />} />
        <Route path="/configuracoes" element={currentUser ? <Layout><ConfigPage settings={enrollmentSettings} setSettings={setEnrollmentSettings} /></Layout> : <Navigate to="/login" />} />
      </Routes>
    </HashRouter>
  );
};

// Internal Settings Component for simplicity
const ConfigPage: React.FC<{ settings: EnrollmentSettings; setSettings: React.Dispatch<React.SetStateAction<EnrollmentSettings>> }> = ({ settings, setSettings }) => {
  return (
    <div className="max-w-2xl bg-white p-8 rounded-xl shadow-sm border">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Settings className="text-emcn-gold" />
        Configurações do Sistema
      </h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Módulo de Autoinscrição</h3>
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
              <div>
                <div className="font-medium text-slate-800">Status das Inscrições</div>
                <div className="text-sm text-slate-500">Permitir que novos alunos se inscrevam pelo site.</div>
              </div>
              <button
                onClick={() => setSettings(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.isOpen ? 'bg-green-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.isOpen ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data Limite de Cadastro</label>
              <input
                type="date"
                value={settings.deadline}
                onChange={(e) => setSettings(prev => ({ ...prev, deadline: e.target.value }))}
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem de Boas-vindas/Instruções</label>
              <textarea
                value={settings.message}
                onChange={(e) => setSettings(prev => ({ ...prev, message: e.target.value }))}
                className="w-full p-2 border rounded-lg h-24"
              />
            </div>
          </div>
        </div>

        <button className="w-full bg-emcn-blue text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors">
          Salvar Alterações
        </button>
      </div>
    </div>
  );
};

export default App;
