
import React, { useState } from 'react';
import { ClassGroup, Student, Teacher, Discipline, ClassSession, School } from '../types';
import {
  Plus, Users, Calendar, ClipboardCheck, LayoutGrid, ChevronRight, X, User,
  Layers, Edit, Trash2, CheckSquare, Settings, Loader2, Check, UserCheck, UserX, AlertCircle
} from 'lucide-react';
import { supabase } from '../supabase';

interface ClassesPageProps {
  classes: ClassGroup[];
  setClasses: React.Dispatch<React.SetStateAction<ClassGroup[]>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  teachers: Teacher[];
  disciplines: Discipline[];
  selectedSchool?: School;
  onBack?: () => void;
}

const ClassesPage: React.FC<ClassesPageProps> = ({ classes, setClasses, students, setStudents, teachers, disciplines, selectedSchool, onBack }) => {
  const [selectedClass, setSelectedClass] = useState<ClassGroup | null>(null);
  const [view, setView] = useState<'DETAILS' | 'ATTENDANCE' | 'PROGRAM' | 'SETTINGS'>('DETAILS');
  const [showAddClass, setShowAddClass] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);

  // Session Form State
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionFormData, setSessionFormData] = useState<Partial<ClassSession>>({ date: new Date().toISOString().split('T')[0] });
  const [loading, setLoading] = useState(false);

  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || 'Desconhecido';
  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || 'Desconhecido';
  const getDisciplineName = (id: string) => disciplines.find(d => d.id === id)?.name || 'Desconhecida';

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    setLoading(true);

    try {
      const newSession: ClassSession = {
        id: sessionFormData.id || Math.random().toString(36).substr(2, 9),
        date: sessionFormData.date || new Date().toISOString(),
        disciplineId: sessionFormData.disciplineId || '',
        teacherId: sessionFormData.teacherId || '',
        attendance: sessionFormData.attendance || {}
      };

      let updatedSessions = [];
      if (sessionFormData.id) {
        updatedSessions = selectedClass.sessions.map(s => s.id === sessionFormData.id ? newSession : s);
      } else {
        updatedSessions = [...selectedClass.sessions, newSession];
      }

      const { error } = await supabase
        .from('classes')
        .update({ sessions: updatedSessions })
        .eq('id', selectedClass.id);

      if (error) throw error;

      const updatedClass = { ...selectedClass, sessions: updatedSessions };
      setSelectedClass(updatedClass);
      setClasses(prev => prev.map(c => c.id === selectedClass.id ? updatedClass : c));
      setShowSessionForm(false);
      setSessionFormData({ date: new Date().toISOString().split('T')[0] });
    } catch (err: any) {
      alert('Erro ao salvar aula: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!selectedClass || !confirm('Excluir esta aula do programa?')) return;
    setLoading(true);
    try {
      const updatedSessions = selectedClass.sessions.filter(s => s.id !== sessionId);
      const { error } = await supabase.from('classes').update({ sessions: updatedSessions }).eq('id', selectedClass.id);
      if (error) throw error;

      const updatedClass = { ...selectedClass, sessions: updatedSessions };
      setSelectedClass(updatedClass);
      setClasses(prev => prev.map(c => c.id === selectedClass.id ? updatedClass : c));
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter teachers based on selected discipline
  const availableTeachers = sessionFormData.disciplineId
    ? teachers.filter(t => t.discipline_ids?.includes(sessionFormData.disciplineId!))
    : [];

  return (
    <div className="space-y-6">
      {!selectedClass ? (
        <>
          <div className="flex justify-between items-center">
            <div>
              {onBack && (
                <button onClick={onBack} className="text-emcn-blue font-medium mb-1 hover:underline flex items-center gap-1">
                  ← Voltar para Escolas
                </button>
              )}
              <h2 className="text-2xl font-bold text-slate-800">
                Turmas {selectedSchool ? `- ${selectedSchool.name}` : ''}
              </h2>
            </div>
            <button
              onClick={() => setShowAddClass(true)}
              className="px-4 py-2 bg-emcn-blue text-white rounded-lg flex items-center gap-2 font-semibold shadow-md"
            >
              <Plus size={18} /> Criar Turma
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.length > 0 ? classes.map(c => (
              <div
                key={c.id}
                onClick={() => setSelectedClass(c)}
                className="bg-white border rounded-2xl p-6 cursor-pointer hover:border-emcn-gold hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emcn-blue/5 text-emcn-blue rounded-xl"><Layers size={24} /></div>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">{c.year}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{c.name}</h3>
                <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5"><Users size={16} /> {c.students.length} Alunos</div>
                  <div className="flex items-center gap-1.5"><Calendar size={16} /> {c.sessions.length} Aulas</div>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                <Layers size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Nenhuma turma cadastrada.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
            <div>
              <button onClick={() => setSelectedClass(null)} className="text-emcn-blue font-medium mb-1 hover:underline flex items-center gap-1">← Voltar</button>
              <h2 className="text-3xl font-serif text-slate-800">{selectedClass.name} <span className="text-slate-400 font-sans">({selectedClass.year})</span></h2>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setView('DETAILS')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'DETAILS' ? 'bg-white shadow-sm text-emcn-blue' : 'text-slate-500 hover:text-slate-700'}`}>Detalhes</button>
              <button onClick={() => setView('PROGRAM')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'PROGRAM' ? 'bg-white shadow-sm text-emcn-blue' : 'text-slate-500 hover:text-slate-700'}`}>Programa</button>
              <button onClick={() => setView('ATTENDANCE')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'ATTENDANCE' ? 'bg-white shadow-sm text-emcn-blue' : 'text-slate-500 hover:text-slate-700'}`}>Frequência</button>
              <button onClick={() => setView('SETTINGS')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'SETTINGS' ? 'bg-white shadow-sm text-emcn-blue' : 'text-slate-500 hover:text-slate-700'}`}>Inscrições</button>
            </div>
          </div>

          {view === 'DETAILS' && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border p-8 space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2"><Users className="text-emcn-gold" /> Lista de Alunos</h3>
                <div className="divide-y border rounded-xl overflow-hidden">
                  {selectedClass.students.map(sid => {
                    const student = students.find(s => s.id === sid);
                    if (!student) return null;

                    const handleApprove = async () => {
                      if (!window.confirm(`Aprovar inscrição de ${student.name}?`)) return;
                      const { error } = await supabase.from('students').update({ status: 'ACTIVE' }).eq('id', student.id);
                      if (!error) {
                        setStudents(prev => prev.map(s => s.id === student.id ? { ...s, status: 'ACTIVE' } : s));
                      }
                    };

                    const handleReject = async () => {
                      if (!window.confirm(`Recusar e remover ${student.name} desta turma?`)) return;
                      const { error } = await supabase.from('classes')
                        .update({ students: selectedClass.students.filter(id => id !== student.id) })
                        .eq('id', selectedClass.id);

                      if (!error) {
                        setClasses(prev => prev.map(c => c.id === selectedClass.id
                          ? { ...c, students: c.students.filter(id => id !== student.id) }
                          : c
                        ));
                      }
                    };

                    return (
                      <div key={sid} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${student.status === 'ACTIVE' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-emcn-gold/10 text-emcn-gold border-emcn-gold/20'
                            }`}>
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{student.name}</div>
                            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{student.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {student.status === 'INACTIVE' ? (
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-emcn-gold/10 text-emcn-gold px-2 py-1 rounded-full animate-pulse">
                                <AlertCircle size={10} /> Pendente
                              </span>
                              <button
                                onClick={handleApprove}
                                title="Aprovar Aluno"
                                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all shadow-md shadow-green-200"
                              >
                                <UserCheck size={16} />
                              </button>
                              <button
                                onClick={handleReject}
                                title="Recusar Inscrição"
                                className="p-2 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-all"
                              >
                                <UserX size={16} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Ativo
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {selectedClass.students.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                      Nenhum aluno cadastrado nesta turma.
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-2xl border p-8 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2"><LayoutGrid className="text-emcn-gold" /> Professores Escalados</h3>
                <div className="space-y-4">
                  {Array.from(new Set(selectedClass.sessions.map(s => s.teacherId))).map((tid: string) => (
                    <div key={tid} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-emcn-blue text-white flex items-center justify-center font-bold">{getTeacherName(tid).charAt(0)}</div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{getTeacherName(tid)}</div>
                        <div className="text-xs text-slate-500">Docente Convidado</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === 'PROGRAM' && (
            <div className="bg-white rounded-3xl border shadow-sm overflow-hidden animate-in fade-in duration-300">
              <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Programa Anual</h3>
                  <p className="text-sm text-slate-500 mt-1">Planeje as disciplinas e professores desta turma.</p>
                </div>
                <button
                  onClick={() => { setSessionFormData({ date: new Date().toISOString().split('T')[0] }); setShowSessionForm(true); }}
                  className="px-6 py-2.5 bg-emcn-blue text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg shadow-emcn-blue/20 transition-all"
                >
                  <Plus size={20} /> Adicionar Aula
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-5">Data</th>
                      <th className="px-8 py-5">Disciplina</th>
                      <th className="px-8 py-5">Professor Responsável</th>
                      <th className="px-8 py-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedClass.sessions.sort((a, b) => a.date.localeCompare(b.date)).map(session => (
                      <tr key={session.id} className="hover:bg-slate-50/50 group transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <Calendar size={16} className="text-emcn-gold" />
                            <span className="font-bold text-emcn-blue">{new Date(session.date).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div>
                            <div className="font-bold text-slate-800">{getDisciplineName(session.disciplineId)}</div>
                            <div className="text-[10px] text-slate-400 font-medium">Módulo Obrigatório</div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border border-white shadow-sm">
                              {getTeacherName(session.teacherId).charAt(0)}
                            </div>
                            <span className="text-sm font-semibold text-slate-600">{getTeacherName(session.teacherId)}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => { setSessionFormData(session); setShowSessionForm(true); }}
                              className="p-2 text-slate-400 hover:text-emcn-blue hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteSession(session.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {selectedClass.sessions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center">
                          <Calendar size={48} className="mx-auto mb-4 text-slate-200" />
                          <p className="text-slate-400 font-medium">Nenhuma aula cadastrada. Comece planejando o cronograma!</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'ATTENDANCE' && (
            <div className="grid lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 bg-white rounded-2xl border shadow-sm p-4 h-fit">
                <h4 className="font-bold text-slate-800 mb-4 px-2">Datas Realizadas</h4>
                <div className="space-y-1">
                  {selectedClass.sessions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSession(s)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${selectedSession?.id === s.id ? 'bg-emcn-blue text-white shadow-lg shadow-emcn-blue/20' : 'hover:bg-slate-50 text-slate-600'
                        }`}
                    >
                      <div className="font-semibold">{new Date(s.date).toLocaleDateString()}</div>
                      <ChevronRight size={16} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-3">
                {selectedSession ? (
                  <div className="bg-white rounded-3xl border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="p-8 bg-slate-50 border-b flex flex-col md:flex-row justify-between gap-6">
                      <div>
                        <div className="text-[10px] font-black text-emcn-gold uppercase tracking-[0.2em] mb-2">Registro de Frequência</div>
                        <h3 className="text-2xl font-bold text-emcn-blue">{getDisciplineName(selectedSession.disciplineId)}</h3>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                            <Calendar size={14} className="text-emcn-gold" /> {new Date(selectedSession.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                            <User size={14} className="text-emcn-gold" /> {getTeacherName(selectedSession.teacherId)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (!selectedClass || !selectedSession) return;
                          setLoading(true);
                          try {
                            const updatedSessions = selectedClass.sessions.map(s =>
                              s.id === selectedSession.id ? selectedSession : s
                            );
                            const { error } = await supabase.from('classes').update({ sessions: updatedSessions }).eq('id', selectedClass.id);
                            if (error) throw error;

                            setClasses(prev => prev.map(c => c.id === selectedClass.id ? { ...c, sessions: updatedSessions } : c));
                            alert('Chamada finalizada e salva com sucesso!');
                          } catch (err: any) {
                            alert('Erro ao salvar chamada: ' + err.message);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        className="px-8 py-3 bg-green-600 text-white rounded-2xl font-bold text-sm hover:bg-green-700 transition-all shadow-xl shadow-green-200 flex items-center gap-2"
                      >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                        Finalizar Chamada
                      </button>
                    </div>
                    <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedClass.students.map(sid => {
                          const isPresent = selectedSession.attendance[sid] === true;
                          return (
                            <div
                              key={sid}
                              onClick={() => {
                                const newAttendance = { ...selectedSession.attendance, [sid]: !isPresent };
                                setSelectedSession({ ...selectedSession, attendance: newAttendance });
                              }}
                              className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${isPresent ? 'border-emcn-gold bg-emcn-gold/5 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isPresent ? 'bg-emcn-gold text-white' : 'bg-slate-100 text-slate-400'
                                  }`}>
                                  {getStudentName(sid).charAt(0)}
                                </div>
                                <div>
                                  <div className={`font-bold transition-colors ${isPresent ? 'text-emcn-blue' : 'text-slate-600'}`}>{getStudentName(sid)}</div>
                                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Matrícula Ativa</div>
                                </div>
                              </div>
                              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isPresent ? 'bg-emcn-gold border-emcn-gold text-white' : 'bg-white border-slate-200'}`}>
                                {isPresent && <Check size={14} strokeWidth={4} />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {selectedClass.students.length === 0 && (
                        <div className="py-20 text-center text-slate-400">
                          <Users size={48} className="mx-auto mb-4 opacity-10" />
                          <p className="font-medium">Não há alunos nesta turma para realizar a chamada.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-96 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 p-12">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                      <ClipboardCheck size={40} className="opacity-20" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-800 mb-2">Pronto para a Chamada?</h4>
                    <p className="text-slate-400 font-medium text-center max-w-xs leading-relaxed">Selecione uma aula no menu lateral para registrar a presença dos alunos.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'SETTINGS' && (
            <div className="max-w-4xl space-y-8">
              <div className="bg-white p-8 rounded-2xl border shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Settings size={20} className="text-emcn-gold" />
                      Configurações de Inscrição
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Defina como os alunos poderão se inscrever nesta turma publicamente.</p>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border">
                    <span className="text-sm font-bold text-slate-700">{selectedClass.isEnrollmentOpen ? 'Inscrições Abertas' : 'Inscrições Fechadas'}</span>
                    <button
                      onClick={async () => {
                        const newStatus = !selectedClass.isEnrollmentOpen;
                        const { error } = await supabase.from('classes').update({ is_enrollment_open: newStatus }).eq('id', selectedClass.id);
                        if (!error) setSelectedClass({ ...selectedClass, isEnrollmentOpen: newStatus });
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative ${selectedClass.isEnrollmentOpen ? 'bg-green-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${selectedClass.isEnrollmentOpen ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Prazo Final</label>
                      <input
                        type="date"
                        value={selectedClass.enrollmentDeadline || ''}
                        onChange={async (e) => {
                          const val = e.target.value;
                          await supabase.from('classes').update({ enrollment_deadline: val }).eq('id', selectedClass.id);
                          setSelectedClass({ ...selectedClass, enrollmentDeadline: val });
                        }}
                        className="w-full px-4 py-2 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Mensagem de Boas-vindas</label>
                      <textarea
                        rows={4}
                        value={selectedClass.enrollmentMessage || ''}
                        onChange={async (e) => {
                          const val = e.target.value;
                          await supabase.from('classes').update({ enrollment_message: val }).eq('id', selectedClass.id);
                          setSelectedClass({ ...selectedClass, enrollmentMessage: val });
                        }}
                        className="w-full px-4 py-2 border rounded-xl"
                        placeholder="Instruções para o aluno..."
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <CheckSquare size={16} className="text-emcn-gold" /> Requisitos Mínimos (Checklist)
                    </label>
                    <div className="space-y-2 max-h-[250px] overflow-y-auto p-1">
                      {selectedClass.enrollmentRequirements?.map((req, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 group">
                          <span className="flex-1 text-sm font-medium">{req}</span>
                          <button
                            onClick={async () => {
                              const newReqs = selectedClass.enrollmentRequirements.filter((_, i) => i !== idx);
                              await supabase.from('classes').update({ enrollment_requirements: newReqs }).eq('id', selectedClass.id);
                              setSelectedClass({ ...selectedClass, enrollmentRequirements: newReqs });
                            }}
                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          ><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const input = e.currentTarget.elements.namedItem('requirement') as HTMLInputElement;
                        if (input.value.trim()) {
                          const newReqs = [...(selectedClass.enrollmentRequirements || []), input.value.trim()];
                          await supabase.from('classes').update({ enrollment_requirements: newReqs }).eq('id', selectedClass.id);
                          setSelectedClass({ ...selectedClass, enrollmentRequirements: newReqs });
                          input.value = '';
                        }
                      }}
                      className="flex gap-2"
                    >
                      <input name="requirement" placeholder="Novo requisito..." className="flex-1 px-4 py-2 border rounded-xl text-sm" />
                      <button type="submit" className="px-4 py-2 bg-emcn-blue text-white rounded-xl text-sm font-bold">Add</button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal - Session Form (Add/Edit Lesson) */}
      {showSessionForm && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-emcn-blue p-8 text-white flex justify-between items-center">
              <h3 className="text-2xl font-bold">{sessionFormData.id ? 'Editar Aula' : 'Nova Aula no Programa'}</h3>
              <button onClick={() => setShowSessionForm(false)} disabled={loading} className="hover:bg-white/10 p-2 rounded-xl transition-colors"><X /></button>
            </div>
            <form onSubmit={handleSaveSession} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Data da Aula</label>
                  <input
                    type="date"
                    required
                    disabled={loading}
                    value={sessionFormData.date?.split('T')[0] || ''}
                    onChange={(e) => setSessionFormData(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-5 py-3 border-2 border-slate-50 rounded-2xl focus:border-emcn-gold outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Selecionar Disciplina</label>
                  <select
                    required
                    disabled={loading}
                    value={sessionFormData.disciplineId || ''}
                    onChange={(e) => setSessionFormData(p => ({ ...p, disciplineId: e.target.value, teacherId: '' }))}
                    className="w-full px-5 py-3 border-2 border-slate-50 rounded-2xl focus:border-emcn-gold outline-none transition-all appearance-none bg-white"
                  >
                    <option value="">Escolha uma disciplina...</option>
                    {disciplines.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.workload}h)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Selecionar Professor Habilitado</label>
                  <select
                    required
                    disabled={loading || !sessionFormData.disciplineId}
                    value={sessionFormData.teacherId || ''}
                    onChange={(e) => setSessionFormData(p => ({ ...p, teacherId: e.target.value }))}
                    className={`w-full px-5 py-3 border-2 border-slate-50 rounded-2xl focus:border-emcn-gold outline-none transition-all appearance-none bg-white ${!sessionFormData.disciplineId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">{sessionFormData.disciplineId ? 'Escolha um professor docente...' : 'Selecione primeiro a disciplina'}</option>
                    {availableTeachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {sessionFormData.disciplineId && availableTeachers.length === 0 && (
                    <p className="mt-2 text-xs text-red-500 font-medium">Nenhum professor habilitado para esta disciplina.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowSessionForm(false)}
                  className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !sessionFormData.teacherId}
                  className="flex-1 py-4 bg-emcn-gold text-white font-bold rounded-2xl shadow-xl hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale"
                >
                  {loading && <Loader2 size={20} className="animate-spin" />}
                  Confirmar Aula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddClass && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-emcn-blue p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Criar Nova Turma</h3>
              <button onClick={() => setShowAddClass(false)} className="hover:bg-white/10 p-1 rounded-lg"><X /></button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newClass = {
                  name: formData.get('name') as string,
                  year: parseInt(formData.get('year') as string),
                  students: [],
                  sessions: [],
                  is_enrollment_open: false,
                  enrollment_requirements: [],
                  school_id: selectedSchool?.id
                };

                const { data, error } = await supabase.from('classes').insert([newClass]).select().single();
                if (!error && data) {
                  const mapped = {
                    ...data,
                    isEnrollmentOpen: data.is_enrollment_open,
                    enrollmentRequirements: data.enrollment_requirements || [],
                    schoolId: data.school_id
                  };
                  setClasses(prev => [...prev, mapped]);
                  setShowAddClass(false);
                }
              }}
              className="p-8 space-y-5"
            >
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome da Turma</label>
                <input name="name" required className="w-full px-4 py-2 border rounded-xl" placeholder="Ex: Turma Alfa" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Ano Letivo</label>
                <input name="year" type="number" defaultValue={new Date().getFullYear()} required className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddClass(false)} className="flex-1 py-3 text-slate-600 font-bold">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-emcn-blue text-white font-bold rounded-xl shadow-lg">Criar Turma</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesPage;
