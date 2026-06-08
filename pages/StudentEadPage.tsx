import React, { useState, useEffect } from 'react';
import { User, ClassGroup, Discipline, EadLesson, EadProgress } from '../types';
import { supabase } from '../supabase';
import {
  Video, BookOpen, CheckCircle2, PlayCircle, ArrowLeft, Loader2,
  Calendar, Award, ChevronRight, X, ExternalLink, AlertCircle, Tv
} from 'lucide-react';

interface StudentEadPageProps {
  currentUser: User;
}

const StudentEadPage: React.FC<StudentEadPageProps> = ({ currentUser }) => {
  const [studentClasses, setStudentClasses] = useState<ClassGroup[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassGroup | null>(null);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(null);
  
  const [lessons, setLessons] = useState<EadLesson[]>([]);
  const [progress, setProgress] = useState<EadProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentStatus, setStudentStatus] = useState<string>('ACTIVE');

  // Video modal state
  const [activeLesson, setActiveLesson] = useState<EadLesson | null>(null);
  const [markingPresence, setMarkingPresence] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, [currentUser.id, currentUser.email]);

  useEffect(() => {
    if (selectedClass && selectedDiscipline) {
      fetchLessonsAndProgress(selectedClass.id, selectedDiscipline.id);
    }
  }, [selectedClass?.id, selectedDiscipline?.id]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      // 1. Fetch student profile by email
      const { data: studentRecords } = await supabase
        .from('students')
        .select('id, status')
        .ilike('email', currentUser.email);

      const sId = studentRecords && studentRecords.length > 0 
        ? studentRecords[0].id 
        : currentUser.id;
      
      const sStatus = studentRecords && studentRecords.length > 0
        ? studentRecords[0].status
        : 'ACTIVE';

      setStudentId(sId);
      setStudentStatus(sStatus);

      // 2. Fetch classes that the student is enrolled in
      const { data: classesData } = await supabase.from('classes').select('*');
      
      if (classesData) {
        const myClasses = classesData
          .filter((c: any) => c.students?.includes(sId) || c.students?.includes(currentUser.id))
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

      // 3. Fetch disciplines
      const { data: discData } = await supabase.from('disciplines').select('*');
      if (discData) {
        setDisciplines(discData);
      }
    } catch (err) {
      console.error('Error fetching EAD student data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessonsAndProgress = async (classId: string, disciplineId: string) => {
    if (!studentId) return;
    setLessonsLoading(true);
    try {
      // Fetch lessons
      const { data: lessonsData } = await supabase
        .from('ead_lessons')
        .select('*')
        .eq('class_id', classId)
        .eq('discipline_id', disciplineId)
        .order('order_index', { ascending: true });

      // Fetch student's progress for this student
      const { data: progressData } = await supabase
        .from('ead_progress')
        .select('*')
        .eq('student_id', studentId);

      if (lessonsData) setLessons(lessonsData);
      if (progressData) setProgress(progressData);
    } catch (err) {
      console.error('Error fetching lessons/progress:', err);
    } finally {
      setLessonsLoading(false);
    }
  };

  // Get disciplines for the current class sessions
  const getClassDisciplines = (): Discipline[] => {
    if (!selectedClass) return [];
    const ids = new Set(selectedClass.sessions.map(s => s.disciplineId));
    return disciplines.filter(d => ids.has(d.id));
  };

  const handleMarkPresence = async (lessonId: string) => {
    if (!studentId) return;
    setMarkingPresence(true);
    try {
      const { data, error } = await supabase
        .from('ead_progress')
        .insert({
          student_id: studentId,
          lesson_id: lessonId
        })
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setProgress(prev => [...prev, data[0]]);
        alert('Presença registrada com sucesso para esta vídeoaula!');
      }
    } catch (err: any) {
      alert('Erro ao marcar presença: ' + err.message);
    } finally {
      setMarkingPresence(false);
    }
  };

  const getYoutubeId = (url: string) => {
    const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  };

  const isCompleted = (lessonId: string) => {
    return progress.some(p => p.lesson_id === lessonId);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-emcn-gold" size={48} />
        <p className="text-slate-500 font-medium animate-pulse">Carregando ambiente de aulas EAD...</p>
      </div>
    );
  }

  if (studentClasses.length === 0) {
    return (
      <div className="bg-white p-12 rounded-[32px] border-2 border-dashed border-slate-200 text-center max-w-2xl mx-auto mt-10 shadow-sm">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={40} className="text-slate-350" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Inscrição não localizada</h2>
        <p className="text-slate-500 mb-6 leading-relaxed">
          Você não está vinculado a nenhuma turma ativa no momento. Entre em contato com a secretaria acadêmica para liberar seu acesso às aulas EAD.
        </p>
      </div>
    );
  }

  const classDisciplines = getClassDisciplines();

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* EAD Header */}
      <div className="bg-gradient-to-r from-emcn-blue to-slate-900 p-8 sm:p-10 rounded-[40px] text-white relative overflow-hidden shadow-2xl shadow-emcn-blue/20">
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center text-emcn-gold border border-white/10 shadow-lg">
              <Tv size={30} />
            </div>
            <div>
              <p className="text-emcn-gold font-bold uppercase tracking-[0.25em] text-[9px]">Plataforma EAD</p>
              <h2 className="text-2xl sm:text-3xl font-serif">Aulas Gravadas & Complementares</h2>
              <p className="text-slate-400 text-xs mt-1">Assista aos conteúdos released e confirme sua presença nas matérias.</p>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm px-6 py-4 rounded-3xl border border-white/10 flex flex-col">
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Turma Atual</span>
            <span className="text-lg font-bold text-emcn-gold">{selectedClass?.name}</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Ano Letivo {selectedClass?.year}</span>
          </div>
        </div>
        
        {/* Background elements */}
        <div className="absolute top-[-40%] right-[-10%] w-96 h-96 bg-emcn-gold/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[-10%] w-64 h-64 bg-emcn-blue/30 rounded-full blur-[80px] pointer-events-none" />
      </div>

      {studentStatus === 'INACTIVE' && (
        <div className="bg-amber-50 border-2 border-amber-250 p-6 rounded-3xl flex items-center gap-4 text-amber-800 shadow-sm">
          <AlertCircle className="text-amber-500 shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-base">Aguardando aprovação</h4>
            <p className="text-sm text-amber-700/90 mt-0.5">Sua matrícula está sendo analisada pela secretaria. Você pode navegar pelas disciplinas e aulas, mas não poderá confirmar presenças até sua conta estar ativa.</p>
          </div>
        </div>
      )}

      {/* Class selection if multiple */}
      {studentClasses.length > 1 && (
        <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-3xl border shadow-sm px-6">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alterar Turma:</span>
          <div className="flex gap-2">
            {studentClasses.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedClass(c); setSelectedDiscipline(null); setLessons([]); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${selectedClass?.id === c.id 
                  ? 'border-emcn-gold bg-emcn-gold/5 text-emcn-blue' 
                  : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid split */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: List of Disciplines */}
        <div className="space-y-4">
          <div className="px-2">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <BookOpen size={16} /> Suas Disciplinas
            </h3>
          </div>

          <div className="space-y-3">
            {classDisciplines.map(disc => {
              const isActive = selectedDiscipline?.id === disc.id;
              return (
                <button
                  key={disc.id}
                  onClick={() => { setSelectedDiscipline(disc); }}
                  className={`w-full flex items-center justify-between p-5 rounded-3xl border text-left transition-all duration-300 ${
                    isActive 
                      ? 'bg-white border-emcn-gold shadow-lg shadow-emcn-gold/5 ring-2 ring-emcn-gold/10' 
                      : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      isActive ? 'bg-emcn-gold text-white shadow-md shadow-emcn-gold/20' : 'bg-slate-50 text-slate-400'
                    }`}>
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{disc.name}</h4>
                      <p className="text-xs text-slate-450 mt-1 line-clamp-1">EAD e Vídeo Aulas</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className={isActive ? 'text-emcn-gold translate-x-1 transition-transform' : 'text-slate-300'} />
                </button>
              );
            })}

            {classDisciplines.length === 0 && (
              <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400">
                <BookOpen size={36} className="mx-auto mb-3 opacity-20" />
                <p className="text-xs">Nenhuma disciplina cadastrada para esta turma.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Lessons list for selected discipline */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDiscipline ? (
            <>
              <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-bold text-slate-800">
                  Aulas de {selectedDiscipline.name}
                </h3>
                <span className="text-xs font-semibold text-emcn-gold bg-emcn-gold/10 px-3 py-1 rounded-full">
                  {lessons.length} {lessons.length === 1 ? 'aula' : 'aulas'} cadastradas
                </span>
              </div>

              {lessonsLoading ? (
                <div className="bg-white p-20 rounded-[32px] border shadow-sm flex items-center justify-center">
                  <Loader2 className="animate-spin text-emcn-blue" size={36} />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {lessons.map(lesson => {
                    const ytId = getYoutubeId(lesson.youtube_url);
                    const completed = isCompleted(lesson.id);

                    return (
                      <div 
                        key={lesson.id} 
                        className="bg-white rounded-[32px] border shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col sm:flex-row items-stretch"
                      >
                        {/* Video Preview Section */}
                        <div 
                          onClick={() => setActiveLesson(lesson)}
                          className="w-full sm:w-56 h-36 bg-slate-900 shrink-0 relative cursor-pointer group"
                        >
                          {ytId ? (
                            <img
                              src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                              alt={lesson.title}
                              className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video size={36} className="text-slate-650" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/45 group-hover:bg-black/35 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <PlayCircle size={26} className="text-emcn-blue translate-x-0.5" />
                            </div>
                          </div>
                          <div className="absolute top-3 left-3 bg-emcn-blue text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                            AULA #{lesson.order_index}
                          </div>
                        </div>

                        {/* Description & Detail Section */}
                        <div className="flex-1 p-6 flex flex-col justify-between">
                          <div>
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <h4 
                                onClick={() => setActiveLesson(lesson)}
                                className="font-bold text-slate-800 text-base hover:text-emcn-blue transition-colors cursor-pointer"
                              >
                                {lesson.title}
                              </h4>
                              {completed ? (
                                <span className="bg-green-50 text-green-700 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm shrink-0">
                                  <CheckCircle2 size={12} /> PRESENÇA OK
                                </span>
                              ) : (
                                <span className="bg-amber-50 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm shrink-0">
                                  <Calendar size={12} /> PENDENTE
                                </span>
                              )}
                            </div>
                            
                            {lesson.lesson_date && (
                              <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider flex items-center gap-1">
                                <Calendar size={11} className="text-emcn-gold" /> Lecionada em: {new Date(lesson.lesson_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                              </p>
                            )}

                            <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                              {lesson.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                            <button
                              onClick={() => setActiveLesson(lesson)}
                              className="text-xs text-emcn-blue hover:text-slate-800 font-bold flex items-center gap-1"
                            >
                              <PlayCircle size={14} /> Assistir Aula
                            </button>

                            {!completed && studentStatus === 'ACTIVE' && (
                              <button
                                onClick={() => handleMarkPresence(lesson.id)}
                                className="bg-emcn-gold hover:bg-[#b08e4d] text-white font-bold text-[11px] px-4 py-2 rounded-xl transition-all shadow-md shadow-emcn-gold/10"
                              >
                                Marcar Presença
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {lessons.length === 0 && (
                    <div className="py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100">
                      <Video size={48} className="mx-auto mb-4 text-slate-200" />
                      <p className="text-lg font-semibold text-slate-500">Nenhuma aula publicada nesta matéria</p>
                      <p className="text-sm text-slate-400 mt-1">Aguarde a postagem de novas aulas gravadas pelo professor.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-24 text-center bg-white rounded-[40px] border shadow-sm p-10 flex flex-col items-center justify-center">
              <Tv size={56} className="text-emcn-gold/30 mb-4 animate-pulse" />
              <h3 className="text-xl font-bold text-slate-800">Selecione uma Disciplina</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">
                Escolha uma das disciplinas na coluna ao lado para visualizar os conteúdos EAD released.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* VIDEO PLAYER MODAL */}
      {activeLesson && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[36px] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-emcn-blue p-6 text-white flex justify-between items-center relative shrink-0">
              <div>
                <p className="text-emcn-gold text-[9px] font-black uppercase tracking-widest">Vídeo Aula</p>
                <h3 className="text-xl font-bold font-serif">{activeLesson.title}</h3>
                {activeLesson.lesson_date && (
                  <p className="text-[11px] text-white/50 mt-0.5">Lecionada em: {new Date(activeLesson.lesson_date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                )}
              </div>
              <button 
                onClick={() => { setActiveLesson(null); }} 
                className="hover:bg-white/10 p-2.5 rounded-2xl transition-colors text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Video Player */}
            <div className="bg-black aspect-video w-full shrink-0">
              {getYoutubeId(activeLesson.youtube_url) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${getYoutubeId(activeLesson.youtube_url)}?autoplay=1`}
                  title={activeLesson.title}
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 flex-col gap-2">
                  <AlertCircle size={36} />
                  <span>URL do YouTube Inválida</span>
                </div>
              )}
            </div>

            {/* Modal Description & Actions */}
            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              <div>
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-2">Resumo da Aula</h4>
                <p className="text-slate-650 text-sm leading-relaxed whitespace-pre-line">{activeLesson.description}</p>
              </div>

              {/* Status and attendance buttons */}
              <div className="bg-slate-50 p-6 rounded-3xl border flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h5 className="font-bold text-slate-800 text-sm">Status da Frequência</h5>
                  <p className="text-xs text-slate-450 mt-1">Marque presença na aula após assistir o vídeo.</p>
                </div>

                <div>
                  {isCompleted(activeLesson.id) ? (
                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-6 py-3 rounded-2xl font-bold text-sm shadow-sm">
                      <CheckCircle2 size={16} /> Presença Confirmada
                    </div>
                  ) : studentStatus === 'INACTIVE' ? (
                    <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-5 py-2.5 rounded-2xl font-semibold text-xs border border-amber-100">
                      <AlertCircle size={15} /> Cadastro Inativo
                    </div>
                  ) : (
                    <button
                      onClick={() => handleMarkPresence(activeLesson.id)}
                      disabled={markingPresence}
                      className="bg-emcn-gold hover:bg-[#b08e4d] text-white px-8 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-emcn-gold/20 flex items-center gap-2"
                    >
                      {markingPresence ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Award size={16} />
                      )}
                      Marcar Presença nesta Aula
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentEadPage;
