
import React, { useState, useEffect } from 'react';
import { User, ClassGroup, ClassSession, Discipline, Teacher, Exam, Grade } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  BookOpen, 
  User as UserIcon,
  Award,
  AlertCircle,
  Loader2,
  ChevronRight,
  ArrowRight,
  FileText,
  Target,
  LayoutDashboard,
  Check
} from 'lucide-react';
import { supabase } from '../supabase';

interface StudentAreaProps {
  currentUser: User;
}

const StudentArea: React.FC<StudentAreaProps> = ({ currentUser }) => {
  const [studentClasses, setStudentClasses] = useState<ClassGroup[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassGroup | null>(null);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'AULAS' | 'NOTAS' | 'PROVAS'>('AULAS');
  const [studentProfileId, setStudentProfileId] = useState<string | null>(null);
  const [studentStatus, setStudentStatus] = useState<string>('ACTIVE');

  // Exam taking state
  const [examInProgress, setExamInProgress] = useState<Exam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submittingExam, setSubmittingExam] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentUser.id, currentUser.email]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Find the student record associated with this user's email
      const { data: studentRecords } = await supabase
        .from('students')
        .select('id, status')
        .ilike('email', currentUser.email);
      
      const studentId = studentRecords && studentRecords.length > 0 
        ? studentRecords[0].id 
        : currentUser.id; 
      
      const studentStatus = studentRecords && studentRecords.length > 0
        ? studentRecords[0].status
        : 'ACTIVE';

      setStudentProfileId(studentId);
      setStudentStatus(studentStatus);

      // 2. Find all classes the student belongs to
      const { data: classesData } = await supabase.from('classes').select('*');
      if (classesData) {
        const myClasses = classesData
          .filter((c: any) => c.students?.includes(studentId) || c.students?.includes(currentUser.id))
          .map((c: any) => ({
            ...c,
            isEnrollmentOpen: c.is_enrollment_open,
            schoolId: c.school_id,
            enrollmentRequirements: c.enrollment_requirements || []
          }));
        
        setStudentClasses(myClasses);
        if (myClasses.length > 0) {
          setSelectedClass(myClasses[0]);
        }
      }

      // 3. Fetch auxiliary data
      const [ 
        { data: discData }, 
        { data: teachData }, 
        { data: examData }, 
        { data: gradeData } 
      ] = await Promise.all([
        supabase.from('disciplines').select('*'),
        supabase.from('teachers').select('*'),
        supabase.from('exams').select('*'),
        supabase.from('grades').select('*').eq('student_id', studentId)
      ]);

      if (discData) setDisciplines(discData);
      if (teachData) setTeachers(teachData);
      if (examData) setExams(examData.map((e: any) => ({ 
        ...e, 
        classId: e.class_id, 
        disciplineId: e.discipline_id, 
        dueDate: e.due_date,
        maxScore: e.max_score 
      })));
      
      let finalGrades = gradeData || [];
      if (finalGrades.length === 0 && studentId !== currentUser.id) {
        const { data: authGrades } = await supabase.from('grades').select('*').eq('student_id', currentUser.id);
        if (authGrades) finalGrades = authGrades;
      }
      
      setGrades(finalGrades.map((g: any) => ({ ...g, examId: g.exam_id, studentId: g.student_id })));

    } catch (err) {
      console.error('Error fetching student area data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (sessionId: string) => {
    if (!selectedClass || !studentProfileId) return;
    setCheckingIn(sessionId);

    try {
      const { data: freshClass, error: fetchError } = await supabase
        .from('classes')
        .select('sessions')
        .eq('id', selectedClass.id)
        .single();

      if (fetchError) throw fetchError;

      const sessions = freshClass.sessions as ClassSession[];
      const updatedSessions = sessions.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            attendance: { ...s.attendance, [studentProfileId]: true }
          };
        }
        return s;
      });

      const { error: updateError } = await supabase
        .from('classes')
        .update({ sessions: updatedSessions })
        .eq('id', selectedClass.id);

      if (updateError) throw updateError;

      const updatedClass = { ...selectedClass, sessions: updatedSessions };
      setSelectedClass(updatedClass);
      setStudentClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c));
      
    } catch (err: any) {
      alert('Erro ao registrar presença: ' + err.message);
    } finally {
      setCheckingIn(null);
    }
  };

  const handleSubmitExam = async () => {
    if (!examInProgress || !studentProfileId) return;
    
    const questions = examInProgress.questions || [];
    if (Object.keys(answers).length < questions.length) {
      if (!window.confirm("Você não respondeu todas as questões. Deseja enviar assim mesmo?")) {
        return;
      }
    }

    setSubmittingExam(true);
    try {
      // Calculate score
      let correctCount = 0;
      questions.forEach((q, idx) => {
        if (answers[idx] === q.correctIndex) {
          correctCount++;
        }
      });

      const score = questions.length > 0 
        ? (correctCount / questions.length) * examInProgress.maxScore 
        : 0;

      const { error } = await supabase.from('grades').insert({
        exam_id: examInProgress.id,
        student_id: studentProfileId,
        score: score,
        comments: `Prova realizada online em ${new Date().toLocaleString()}`
      });

      if (error) throw error;

      alert(`Prova enviada com sucesso! Sua nota: ${score.toFixed(1)}`);
      
      // Update local grades
      const newGrade = { 
        id: 'temp-' + Date.now(), 
        examId: examInProgress.id, 
        studentId: studentProfileId, 
        score 
      };
      setGrades(prev => [...prev, newGrade]);
      setExamInProgress(null);
      setActiveTab('NOTAS');
      
    } catch (err: any) {
      alert('Erro ao enviar prova: ' + err.message);
    } finally {
      setSubmittingExam(false);
    }
  };

  const getDisciplineName = (id: string) => disciplines.find(d => d.id === id)?.name || 'Disciplina';
  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || 'Professor';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-emcn-gold" size={48} />
        <p className="text-slate-500 font-medium">Carregando sua área...</p>
      </div>
    );
  }

  if (studentClasses.length === 0) {
    return (
      <div className="bg-white p-12 rounded-[32px] border-2 border-dashed border-slate-200 text-center max-w-2xl mx-auto mt-10">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={40} className="text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Inscrição não localizada</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Não encontramos nenhuma turma ativa vinculada ao seu usuário ({currentUser.email}). 
          Se você acabou de se inscrever, aguarde a aprovação da secretaria ou verifique se o e-mail da inscrição é o mesmo do seu login.
        </p>
        <ArrowRight className="mx-auto text-emcn-gold animate-bounce" />
      </div>
    );
  }

  const sortedSessions = selectedClass ? [...selectedClass.sessions].sort((a, b) => a.date.localeCompare(b.date)) : [];
  const today = new Date().toISOString().split('T')[0];
  
  const presentCount = selectedClass ? selectedClass.sessions.filter(s => studentProfileId && s.attendance[studentProfileId] === true).length : 0;
  const attendanceRate = selectedClass && selectedClass.sessions.length > 0 
    ? Math.round((presentCount / selectedClass.sessions.length) * 100) 
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Section */}
      <div className="bg-emcn-blue p-10 rounded-[40px] text-white relative overflow-hidden shadow-2xl shadow-emcn-blue/20">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center text-2xl font-bold text-emcn-gold border border-white/10">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <p className="text-emcn-gold font-bold uppercase tracking-[0.2em] text-[10px]">Portal do Aluno</p>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-serif">Olá, {currentUser.name}!</h2>
                {studentStatus === 'INACTIVE' && (
                  <span className="bg-emcn-gold text-emcn-blue text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 animate-pulse shadow-lg shadow-emcn-gold/20">
                    <AlertCircle size={12} /> AGUARDANDO APROVAÇÃO
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/10">
              <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Turmas Ativas</p>
              <p className="text-xl font-bold">{studentClasses.length}</p>
              <div className="flex gap-1 mt-2">
                {studentClasses.map(c => (
                  <div key={c.id} className={`w-2 h-2 rounded-full ${selectedClass?.id === c.id ? 'bg-emcn-gold' : 'bg-white/20'}`} />
                ))}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/10">
              <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Frequência (Turma Atual)</p>
              <p className="text-xl font-bold">{attendanceRate}%</p>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emcn-gold h-full rounded-full" style={{ width: `${attendanceRate}%` }} />
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/10">
              <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Presenças</p>
              <p className="text-xl font-bold">{presentCount} <span className="text-white/30 text-sm font-normal">/ {selectedClass?.sessions.length || 0}</span></p>
              <p className="text-emcn-gold text-xs font-medium">Histórico acadêmico</p>
            </div>
          </div>
        </div>
        
        {/* Background Decor */}
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-emcn-gold/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-emcn-gold/5 rounded-full blur-[60px]" />
      </div>

      {/* Class Selector if multiple classes */}
      {studentClasses.length > 1 && (
        <div className="flex flex-wrap gap-4 items-center px-2">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <LayoutDashboard size={16} /> Selecione a Turma:
          </span>
          <div className="flex gap-2">
            {studentClasses.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClass(c)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${selectedClass?.id === c.id 
                  ? 'border-emcn-gold bg-emcn-gold/5 text-emcn-blue' 
                  : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex bg-white p-1 rounded-2xl border w-fit mx-auto shadow-sm">
        <button 
          onClick={() => setActiveTab('AULAS')}
          className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'AULAS' ? 'bg-emcn-blue text-white shadow-lg shadow-emcn-blue/20' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Calendar size={18} /> Aulas e Frequência
        </button>
        <button 
          onClick={() => setActiveTab('PROVAS')}
          className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'PROVAS' ? 'bg-emcn-blue text-white shadow-lg shadow-emcn-blue/20' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <FileText size={18} /> Provas Ativas
        </button>
        <button 
          onClick={() => setActiveTab('NOTAS')}
          className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'NOTAS' ? 'bg-emcn-blue text-white shadow-lg shadow-emcn-blue/20' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Target size={18} /> Minhas Notas
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'AULAS' ? (
            <>
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="text-emcn-gold" /> {selectedClass?.name} - Cronograma
                </h3>
                <span className="text-xs text-slate-400 font-medium">Sessões da turma</span>
              </div>

              <div className="space-y-4">
                {sortedSessions.map((session) => {
                  const isToday = session.date === today;
                  const isPresent = studentProfileId && session.attendance[studentProfileId] === true;
                  
                  return (
                    <div 
                      key={session.id}
                      className={`group bg-white p-6 rounded-[32px] border-2 transition-all duration-300 ${
                        isToday && !isPresent 
                          ? 'border-emcn-gold ring-4 ring-emcn-gold/5 shadow-xl scale-[1.02]' 
                          : 'border-slate-50 hover:border-slate-100 hover:shadow-md'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                        <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold transition-colors ${
                            isPresent ? 'bg-green-50 text-green-600' : isToday ? 'bg-emcn-gold text-white' : 'bg-slate-50 text-slate-400'
                          }`}>
                            <span className="text-[10px] leading-none mb-1 uppercase">{new Date(session.date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                            <span className="text-xl leading-none">{new Date(session.date).getDate()}</span>
                          </div>
                          
                          <div>
                            <h4 className="font-bold text-slate-800 group-hover:text-emcn-blue transition-colors">{getDisciplineName(session.disciplineId)}</h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              <span className="flex items-center gap-1"><UserIcon size={12} className="text-emcn-gold" /> {getTeacherName(session.teacherId)}</span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full" />
                              <span className="flex items-center gap-1"><Clock size={12} className="text-emcn-gold" /> 19:30 - 21:30</span>
                            </div>
                          </div>
                        </div>

                        <div className="w-full sm:w-auto">
                          {isPresent ? (
                            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-5 py-2.5 rounded-2xl font-bold text-sm">
                              <CheckCircle2 size={18} /> Presença Confirmada
                            </div>
                          ) : isToday ? (
                            <button
                              onClick={() => handleCheckIn(session.id)}
                              disabled={checkingIn === session.id}
                              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emcn-gold text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-[#b08e4d] transition-all shadow-lg shadow-emcn-gold/20"
                            >
                              {checkingIn === session.id ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <Award size={18} />
                              )}
                              Registrar Minha Presença
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 bg-slate-50 text-slate-400 px-5 py-2.5 rounded-2xl font-bold text-sm">
                              <XCircle size={18} /> Falta ou Não Iniciada
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : activeTab === 'PROVAS' ? (
            <>
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="text-emcn-gold" /> Provas Disponíveis
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {exams.filter(e => e.classId === selectedClass?.id && e.status === 'ACTIVE').map(exam => {
                  const alreadyTaken = grades.some(g => g.examId === exam.id);
                  const discipline = disciplines.find(d => d.id === exam.disciplineId);
                  
                  return (
                    <div key={exam.id} className="bg-white p-8 rounded-[32px] border shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-emcn-gold/10 rounded-2xl flex items-center justify-center text-emcn-gold">
                          <Target size={32} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-lg">{exam.title}</h4>
                          <p className="text-sm text-slate-500 font-medium">{discipline?.name || 'Disciplina'}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                            <Clock size={12} /> Prazo: {new Date(exam.dueDate || exam.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full sm:w-auto">
                        {alreadyTaken ? (
                          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-6 py-3 rounded-2xl font-bold text-sm">
                            <CheckCircle2 size={18} /> Prova Realizada
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setExamInProgress(exam);
                              setCurrentQuestionIndex(0);
                              setAnswers({});
                            }}
                            className="w-full bg-emcn-blue text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emcn-blue/20"
                          >
                            <ArrowRight size={18} /> Fazer Prova
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {exams.filter(e => e.classId === selectedClass?.id && e.status === 'ACTIVE').length === 0 && (
                  <div className="py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-200 text-slate-400">
                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Nenhuma prova ativa disponível para sua turma.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Award className="text-emcn-gold" /> Resultados de Avaliações
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {grades.map(grade => {
                  const exam = exams.find(e => e.id === grade.examId);
                  const discipline = exam ? disciplines.find(d => d.id === exam.disciplineId) : null;
                  
                  return (
                    <div key={grade.id} className="bg-white p-8 rounded-[32px] border shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-emcn-gold">
                          <FileText size={32} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-lg">{exam?.title || 'Avaliação'}</h4>
                          <p className="text-sm text-slate-500 font-medium">{discipline?.name || 'Disciplina'}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                            <Calendar size={12} /> {exam ? new Date(exam.date).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center sm:text-right bg-slate-50 sm:bg-transparent p-6 sm:p-0 rounded-2xl w-full sm:w-auto">
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sua Nota</div>
                          <div className="text-4xl font-serif font-black text-emcn-blue">
                            {grade.score.toFixed(1)}
                            <span className="text-lg text-slate-300 font-sans ml-1">/ {exam?.maxScore || 10}</span>
                          </div>
                          <div className={`text-xs font-bold ${grade.score >= ((exam?.maxScore || 10) * 0.7) ? 'text-green-600' : 'text-red-500'}`}>
                            {grade.score >= ((exam?.maxScore || 10) * 0.7) ? 'Aprovado' : 'Abaixo da Média'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {grades.length === 0 && (
                  <div className="py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-200 text-slate-400">
                    <Award size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Você ainda não possui notas lançadas.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Column: Sidebar info */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[32px] border shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="text-emcn-gold" size={20} /> Materiais & Links
            </h3>
            <div className="space-y-3">
              <a href="#" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-emcn-gold/5 hover:border-emcn-gold border border-transparent transition-all group">
                <span className="text-sm font-medium text-slate-600">Material de Apoio (PDF)</span>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-emcn-gold" />
              </a>
              <a href="#" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-emcn-gold/5 hover:border-emcn-gold border border-transparent transition-all group">
                <span className="text-sm font-medium text-slate-600">Link da Videoaula</span>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-emcn-gold" />
              </a>
              <a href="#" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-emcn-gold/5 hover:border-emcn-gold border border-transparent transition-all group">
                <span className="text-sm font-medium text-slate-600">Calendário Acadêmico</span>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-emcn-gold" />
              </a>
            </div>
          </div>

          <div className="bg-emcn-gold/10 p-8 rounded-[32px] border border-emcn-gold/20">
            <h3 className="font-bold text-emcn-blue flex items-center gap-2 mb-4">
              <Award className="text-emcn-gold" size={20} /> Aviso Importante
            </h3>
            <p className="text-sm text-emcn-blue/70 leading-relaxed">
              As notas são lançadas pelos professores após a correção das provas. Caso sua nota não esteja aparecendo, entre em contato com a secretaria.
            </p>
          </div>
        </div>
      </div>
      {/* Exam In Progress Overlay */}
      {examInProgress && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-emcn-blue p-8 text-white relative flex-shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-serif">{examInProgress.title}</h3>
                  <p className="text-white/60 text-sm mt-1">{getDisciplineName(examInProgress.disciplineId)} • Questão {currentQuestionIndex + 1} de {examInProgress.questions?.length || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emcn-gold mb-1">Nota Máxima</p>
                  <p className="text-2xl font-bold">{examInProgress.maxScore}</p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-8 bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emcn-gold h-full rounded-full transition-all duration-500" 
                  style={{ width: `${((currentQuestionIndex + 1) / (examInProgress.questions?.length || 1)) * 100}%` }} 
                />
              </div>
            </div>

            {/* Question Body */}
            <div className="p-10 flex-1 overflow-y-auto">
              {examInProgress.questions && examInProgress.questions[currentQuestionIndex] ? (
                <div className="space-y-8">
                  <h4 className="text-2xl font-bold text-slate-800 leading-tight">
                    {examInProgress.questions[currentQuestionIndex].text}
                  </h4>

                  <div className="grid grid-cols-1 gap-4">
                    {examInProgress.questions[currentQuestionIndex].options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => setAnswers({ ...answers, [currentQuestionIndex]: idx })}
                        className={`group p-6 rounded-3xl border-2 transition-all flex items-center gap-6 text-left ${
                          answers[currentQuestionIndex] === idx
                            ? 'border-emcn-gold bg-emcn-gold/5 shadow-lg shadow-emcn-gold/10'
                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-all ${
                          answers[currentQuestionIndex] === idx
                            ? 'bg-emcn-gold text-white scale-110'
                            : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className={`text-lg font-medium flex-1 ${
                          answers[currentQuestionIndex] === idx ? 'text-slate-800' : 'text-slate-600'
                        }`}>
                          {option}
                        </span>
                        {answers[currentQuestionIndex] === idx && (
                          <div className="w-6 h-6 bg-emcn-gold rounded-full flex items-center justify-center text-white">
                            <Check size={14} strokeWidth={4} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-400">
                  <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Questão não localizada.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 bg-slate-50 border-t flex flex-col sm:flex-row justify-between items-center gap-6 flex-shrink-0">
              <button
                onClick={() => {
                  if (window.confirm("Deseja realmente sair? Seu progresso nesta prova será perdido.")) {
                    setExamInProgress(null);
                  }
                }}
                className="text-slate-400 font-bold hover:text-red-500 transition-colors"
              >
                Sair da Prova
              </button>

              <div className="flex gap-4 w-full sm:w-auto">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 ${
                    currentQuestionIndex === 0 
                      ? 'text-slate-300 cursor-not-allowed' 
                      : 'bg-white border text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Anterior
                </button>

                {currentQuestionIndex < (examInProgress.questions?.length || 0) - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="flex-1 sm:flex-none px-12 py-4 bg-emcn-blue text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-emcn-blue/20"
                  >
                    Próxima Questão
                  </button>
                ) : (
                  <button
                    disabled={submittingExam}
                    onClick={handleSubmitExam}
                    className="flex-1 sm:flex-none px-12 py-4 bg-emcn-gold text-emcn-blue rounded-2xl font-bold hover:bg-[#b08e4d] transition-all shadow-xl shadow-emcn-gold/20 flex items-center justify-center gap-2"
                  >
                    {submittingExam ? <Loader2 size={20} className="animate-spin" /> : 'Finalizar Prova'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentArea;
