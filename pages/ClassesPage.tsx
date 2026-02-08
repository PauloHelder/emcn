
import React, { useState } from 'react';
import { ClassGroup, Student, Teacher, Discipline, ClassSession } from '../types';
// Fixed: Added missing Layers and Edit imports from lucide-react
import { Plus, Users, Calendar, ClipboardCheck, LayoutGrid, List, ChevronRight, X, User, BookOpen, Layers, Edit } from 'lucide-react';

interface ClassesPageProps {
  classes: ClassGroup[];
  // Added setClasses to fix TypeScript error where App.tsx passes it but it was missing here
  setClasses: React.Dispatch<React.SetStateAction<ClassGroup[]>>;
  students: Student[];
  teachers: Teacher[];
  disciplines: Discipline[];
}

const ClassesPage: React.FC<ClassesPageProps> = ({ classes, setClasses, students, teachers, disciplines }) => {
  const [selectedClass, setSelectedClass] = useState<ClassGroup | null>(null);
  const [view, setView] = useState<'DETAILS' | 'ATTENDANCE' | 'PROGRAM'>('DETAILS');
  const [showAddClass, setShowAddClass] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);

  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || 'Desconhecido';
  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || 'Desconhecido';
  const getDisciplineName = (id: string) => disciplines.find(d => d.id === id)?.name || 'Desconhecida';

  return (
    <div className="space-y-6">
      {!selectedClass ? (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Turmas</h2>
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
            </div>
          </div>

          {view === 'DETAILS' && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border p-8 space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2"><Users className="text-emcn-gold" /> Lista de Alunos</h3>
                <div className="divide-y border rounded-xl overflow-hidden">
                  {selectedClass.students.map(sid => {
                    const student = students.find(s => s.id === sid);
                    return (
                      <div key={sid} className="flex items-center justify-between p-4 hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{student?.name.charAt(0)}</div>
                          <span className="font-medium">{student?.name}</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${student?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {student?.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-white rounded-2xl border p-8 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2"><LayoutGrid className="text-emcn-gold" /> Professores Escalados</h3>
                <div className="space-y-4">
                  {/* Fixed: Added explicit typing for tid to avoid "unknown" inference error */}
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
            <div className="bg-white rounded-2xl border overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-xl font-bold">Programa Anual</h3>
                <button className="text-emcn-blue font-semibold hover:underline">+ Adicionar Aula</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b text-slate-500 text-xs font-bold uppercase">
                    <tr>
                      <th className="px-6 py-4">Data</th>
                      <th className="px-6 py-4">Disciplina</th>
                      <th className="px-6 py-4">Professor</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedClass.sessions.sort((a, b) => a.date.localeCompare(b.date)).map(session => (
                      <tr key={session.id} className="hover:bg-slate-50 group">
                        <td className="px-6 py-4 text-sm font-bold text-emcn-blue">{new Date(session.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800">{getDisciplineName(session.disciplineId)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-emcn-gold" />
                            <span className="text-sm text-slate-600">{getTeacherName(session.teacherId)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-slate-400 hover:text-emcn-blue"><Edit size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'ATTENDANCE' && (
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Session List */}
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

              {/* Attendance Sheet */}
              <div className="lg:col-span-3">
                {selectedSession ? (
                  <div className="bg-white rounded-2xl border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="p-6 bg-slate-50 border-b flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold text-emcn-gold uppercase mb-1">Chamada e Presença</div>
                        <h3 className="text-xl font-bold">{getDisciplineName(selectedSession.disciplineId)}</h3>
                        <div className="text-sm text-slate-500 mt-1">Data: {new Date(selectedSession.date).toLocaleDateString()} • Professor: {getTeacherName(selectedSession.teacherId)}</div>
                      </div>
                      <button className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition-all shadow-md">Finalizar Chamada</button>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedClass.students.map(sid => {
                          const isPresent = selectedSession.attendance[sid] === true;
                          return (
                            <div key={sid} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${isPresent ? 'border-green-100 bg-green-50/30' : 'border-slate-100 bg-white'
                              }`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isPresent ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                                  }`}>
                                  {getStudentName(sid).charAt(0)}
                                </div>
                                <span className="font-semibold text-slate-800">{getStudentName(sid)}</span>
                              </div>
                              <button
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isPresent ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                                  }`}
                              >
                                {isPresent ? 'Presente' : 'Marcar Falta'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
                    <ClipboardCheck size={48} className="mb-4 opacity-20" />
                    <p className="font-medium text-lg">Selecione uma aula para realizar a chamada</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClassesPage;
