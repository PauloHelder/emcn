import React, { useState, useEffect } from 'react';
import { ClassGroup, Student, Discipline, Exam, Grade } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  BookOpen, 
  AlertCircle, 
  Loader2, 
  ClipboardCheck, 
  User, 
  Check, 
  Search, 
  Filter, 
  TrendingUp 
} from 'lucide-react';
import { supabase } from '../supabase';

interface ExamSubmissionsPageProps {
  classes: ClassGroup[];
  disciplines: Discipline[];
  students: Student[];
}

const ExamSubmissionsPage: React.FC<ExamSubmissionsPageProps> = ({ classes, disciplines, students }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [exams, setExams] = useState<Exam[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedSubmissionForGabarito, setSelectedSubmissionForGabarito] = useState<{ grade: Grade; exam: Exam; student: Student } | null>(null);

  // Load all exams when class selection changes
  useEffect(() => {
    if (selectedClassId) {
      fetchExamsForClass(selectedClassId);
      setSelectedExamId('');
      setFilterStatus('');
    } else {
      setExams([]);
      setSelectedExamId('');
      setFilterStatus('');
    }
  }, [selectedClassId]);

  // Load all grades when selected exam changes
  useEffect(() => {
    if (selectedExamId) {
      fetchGradesForExam(selectedExamId);
      setFilterStatus('');
    } else {
      setGrades([]);
      setFilterStatus('');
    }
  }, [selectedExamId]);

  const fetchExamsForClass = async (classId: string) => {
    setLoadingExams(true);
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('class_id', classId);

      if (error) throw error;

      setExams((data || []).map((e: any) => ({
        ...e,
        classId: e.class_id,
        disciplineId: e.discipline_id,
        dueDate: e.due_date,
        maxScore: e.max_score,
        questions: e.questions || []
      })));
    } catch (err) {
      console.error('Erro ao buscar provas para turma:', err);
    } finally {
      setLoadingExams(false);
    }
  };

  const fetchGradesForExam = async (examId: string) => {
    setLoadingGrades(true);
    try {
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .eq('exam_id', examId);

      if (error) throw error;

      setGrades((data || []).map((g: any) => ({
        ...g,
        examId: g.exam_id,
        studentId: g.student_id,
        answers: g.answers
      })));
    } catch (err) {
      console.error('Erro ao buscar notas para prova:', err);
    } finally {
      setLoadingGrades(false);
    }
  };

  const getDisciplineName = (id: string) => disciplines.find(d => d.id === id)?.name || 'Disciplina';
  
  // Calculations and formatting
  const selectedClass = classes.find(c => c.id === selectedClassId);
  const selectedExam = exams.find(e => e.id === selectedExamId);

  // Filter students that belong to the class
  const classStudents = selectedClass 
    ? students.filter(s => selectedClass.students?.includes(s.id))
    : [];

  // Filtered by search query, status and sorted alphabetically
  const filteredStudents = classStudents
    .filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            student.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const grade = grades.find(g => g.studentId === student.id);
      const isSubmitted = !!grade;
      
      let matchesStatus = true;
      if (filterStatus === 'REALIZADA') {
        matchesStatus = isSubmitted;
      } else if (filterStatus === 'PENDENTE') {
        matchesStatus = !isSubmitted;
      }
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Statistics calculations
  const totalStudentsCount = classStudents.length;
  const submissionsCount = grades.length;
  const pendingCount = Math.max(0, totalStudentsCount - submissionsCount);
  const averageScore = submissionsCount > 0
    ? grades.reduce((acc, curr) => acc + curr.score, 0) / submissionsCount
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif text-slate-800 flex items-center gap-3">
            <ClipboardCheck className="text-emcn-gold" size={32} /> Acompanhamento de Provas
          </h2>
          <p className="text-slate-500 font-medium mt-1">Consulte notas, gabaritos e submissões dos alunos por turma.</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
            showFilters 
              ? 'bg-emcn-blue text-white border-emcn-blue shadow-lg shadow-emcn-blue/15' 
              : 'bg-white text-slate-700 border-slate-100 hover:bg-slate-50'
          }`}
        >
          <Filter size={18} /> {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="bg-white p-8 rounded-[32px] border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top duration-300">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Filter size={14} className="text-emcn-gold" /> Selecione a Turma
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 font-semibold text-slate-700 focus:border-emcn-gold focus:outline-none transition-all duration-300 cursor-pointer"
            >
              <option value="">Selecione uma turma...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.year})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <BookOpen size={14} className="text-emcn-gold" /> Selecione a Prova
            </label>
            <select
              value={selectedExamId}
              disabled={!selectedClassId || loadingExams}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 font-semibold text-slate-700 focus:border-emcn-gold focus:outline-none transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingExams ? (
                <option>Buscando provas...</option>
              ) : !selectedClassId ? (
                <option value="">Selecione primeiro uma turma...</option>
              ) : exams.length === 0 ? (
                <option value="">Nenhuma prova ativa encontrada nesta turma</option>
              ) : (
                <>
                  <option value="">Selecione uma prova...</option>
                  {exams.map(e => (
                    <option key={e.id} value={e.id}>{e.title} ({getDisciplineName(e.disciplineId)})</option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>
      )}

      {/* Main Content Areas */}
      {!selectedClassId || !selectedExamId ? (
        <div className="bg-white p-16 rounded-[40px] border border-slate-100 text-center max-w-2xl mx-auto shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 border border-slate-100">
            <ClipboardCheck size={40} className="text-slate-300" />
          </div>
          <h3 className="text-2xl font-serif text-slate-800 mb-3">Selecione os Filtros</h3>
          <p className="text-slate-500 leading-relaxed max-w-md mx-auto">
            Escolha uma turma e uma prova nos filtros acima para visualizar a lista de submissões e o desempenho dos alunos.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Stats Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-[28px] border shadow-sm">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total de Alunos</p>
              <p className="text-3xl font-serif font-black text-slate-800">{totalStudentsCount}</p>
            </div>
            <div className="bg-white p-6 rounded-[28px] border shadow-sm">
              <p className="text-green-600/70 text-xs font-bold uppercase tracking-wider mb-1">Provas Entregues</p>
              <p className="text-3xl font-serif font-black text-green-600">{submissionsCount}</p>
            </div>
            <div className="bg-white p-6 rounded-[28px] border shadow-sm">
              <p className="text-amber-600/70 text-xs font-bold uppercase tracking-wider mb-1">Pendentes</p>
              <p className="text-3xl font-serif font-black text-amber-600">{pendingCount}</p>
            </div>
            <div className="bg-white p-6 rounded-[28px] border shadow-sm relative overflow-hidden">
              <p className="text-emcn-gold text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                <TrendingUp size={12} /> Média Geral
              </p>
              <p className="text-3xl font-serif font-black text-emcn-blue">
                {averageScore.toFixed(1)}
                <span className="text-base text-slate-400 font-sans font-normal ml-1">/ {selectedExam?.maxScore || 10}</span>
              </p>
            </div>
          </div>

          {/* Search bar & Students Table */}
          <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
              <h3 className="font-serif text-lg text-slate-800 font-bold">Submissões dos Alunos</h3>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar aluno..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm font-semibold text-slate-700 focus:border-emcn-gold focus:outline-none transition-all"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full sm:w-44 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:border-emcn-gold focus:outline-none transition-all cursor-pointer"
                >
                  <option value="">Todos os Status</option>
                  <option value="REALIZADA">Realizada</option>
                  <option value="PENDENTE">Pendente</option>
                </select>
              </div>
            </div>

            {loadingGrades ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-emcn-gold" size={40} />
                <p className="text-slate-500 font-medium">Buscando notas da turma...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <User size={48} className="mx-auto mb-4 opacity-20" />
                <p>Nenhum aluno encontrado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/20">
                      <th className="px-6 py-4">Aluno</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Nota</th>
                      <th className="px-6 py-4">Realizado em</th>
                      <th className="px-6 py-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(student => {
                      const grade = grades.find(g => g.studentId === student.id);
                      const isSubmitted = !!grade;
                      
                      return (
                        <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-all">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-bold border">
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{student.name}</p>
                                <p className="text-xs text-slate-400 font-semibold">{student.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            {isSubmitted ? (
                              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 flex items-center gap-1.5 w-fit">
                                <CheckCircle2 size={13} /> Realizada
                              </span>
                            ) : (
                              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 flex items-center gap-1.5 w-fit">
                                <Clock size={13} /> Pendente
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            {isSubmitted ? (
                              <span className="font-serif font-black text-emcn-blue text-lg">
                                {grade.score.toFixed(1)}
                                <span className="text-xs text-slate-400 font-sans font-normal ml-0.5">/ {selectedExam?.maxScore}</span>
                              </span>
                            ) : (
                              <span className="text-slate-300 font-bold">-</span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-sm text-slate-500 font-semibold">
                            {isSubmitted && grade.comments?.includes('online em')
                              ? grade.comments.split('online em')[1]?.trim()
                              : isSubmitted
                              ? 'Lançada'
                              : '-'}
                          </td>
                          <td className="px-6 py-5 text-right">
                            {isSubmitted && selectedExam ? (
                              <button
                                onClick={() => setSelectedSubmissionForGabarito({ grade, exam: selectedExam, student })}
                                className="px-4 py-2 border-2 border-emcn-gold text-emcn-blue hover:bg-emcn-gold hover:text-white rounded-xl font-bold text-xs transition-all inline-flex items-center gap-2 cursor-pointer"
                              >
                                <BookOpen size={14} /> Ver Gabarito
                              </button>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Submission Gabarito Modal Overlay */}
      {selectedSubmissionForGabarito && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-emcn-blue p-8 text-white relative flex-shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-serif">Respostas de {selectedSubmissionForGabarito.student.name}</h3>
                  <p className="text-white/60 text-sm mt-1.5">{selectedSubmissionForGabarito.exam.title} • {getDisciplineName(selectedSubmissionForGabarito.exam.disciplineId)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emcn-gold mb-1">Nota do Aluno</p>
                  <p className="text-2xl font-bold text-emcn-gold">
                    {selectedSubmissionForGabarito.grade.score.toFixed(1)}
                    <span className="text-sm font-normal text-white/50 ml-1">/ {selectedSubmissionForGabarito.exam.maxScore}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable Questions list */}
            <div className="p-8 flex-1 overflow-y-auto space-y-8">
              {!selectedSubmissionForGabarito.grade.answers && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <div>
                    <h5 className="font-bold text-sm">Respostas não gravadas</h5>
                    <p className="text-xs text-amber-700 mt-1">Esta prova foi realizada antes da atualização do sistema, portanto as respostas específicas do aluno não foram registradas. Abaixo está sendo exibido apenas o gabarito oficial.</p>
                  </div>
                </div>
              )}
              {selectedSubmissionForGabarito.exam.questions?.map((question, qIdx) => {
                const qType = question.type || 'SINGLE_CHOICE';
                const studentAnswer = selectedSubmissionForGabarito.grade.answers?.[qIdx];
                
                // Calculate question score and status
                let isCorrect = false;
                let isPartial = false;
                let questionPoints = 0;
                const pointsPerQuestion = selectedSubmissionForGabarito.exam.maxScore / (selectedSubmissionForGabarito.exam.questions?.length || 1);

                if (qType === 'SINGLE_CHOICE' || qType === 'TRUE_FALSE') {
                  isCorrect = studentAnswer === question.correctIndex;
                  questionPoints = isCorrect ? pointsPerQuestion : 0;
                } else if (qType === 'MULTIPLE_CHOICE') {
                  const studentAnswers = (studentAnswer as number[]) || [];
                  const correctIndices = question.correctIndices || [];
                  if (correctIndices.length > 0) {
                    const correctSelected = studentAnswers.filter(a => correctIndices.includes(a)).length;
                    const incorrectSelected = studentAnswers.filter(a => !correctIndices.includes(a)).length;
                    const fraction = Math.max(0, (correctSelected - incorrectSelected) / correctIndices.length);
                    isCorrect = fraction === 1;
                    isPartial = fraction > 0 && fraction < 1;
                    questionPoints = fraction * pointsPerQuestion;
                  }
                }

                return (
                  <div key={qIdx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                    <div className="flex justify-between items-start gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">Questão {qIdx + 1}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-black tracking-wider rounded-md uppercase ${
                          qType === 'TRUE_FALSE' ? 'bg-blue-100 text-blue-800' :
                          qType === 'MULTIPLE_CHOICE' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {qType === 'TRUE_FALSE' ? 'Verd/Falso' :
                           qType === 'MULTIPLE_CHOICE' ? 'Múltipla Escolha' :
                           'Escolha Única'}
                        </span>
                      </div>

                      {selectedSubmissionForGabarito.grade.answers ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          isCorrect ? 'bg-green-100 text-green-800' :
                          isPartial ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {isCorrect ? 'Correta' : isPartial ? 'Parcial' : 'Incorreta'} (+{questionPoints.toFixed(2)} pts)
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                          Valor: {pointsPerQuestion.toFixed(2)} pts
                        </span>
                      )}
                    </div>

                    <p className="text-slate-800 font-semibold">{question.text}</p>

                    <div className="grid grid-cols-1 gap-2 pt-2">
                      {question.options.map((option, oIdx) => {
                        const isCorrectOption = qType === 'MULTIPLE_CHOICE'
                          ? (question.correctIndices || []).includes(oIdx)
                          : question.correctIndex === oIdx;

                        const isSelectedByStudent = qType === 'MULTIPLE_CHOICE'
                          ? ((studentAnswer as number[]) || []).includes(oIdx)
                          : studentAnswer === oIdx;

                        let optionStyle = 'border-slate-200 bg-white text-slate-700';
                        let icon = null;

                        if (isCorrectOption) {
                          optionStyle = 'border-green-300 bg-green-50 text-green-900 font-semibold';
                          icon = <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white flex-shrink-0"><Check size={12} strokeWidth={4} /></div>;
                        } else if (isSelectedByStudent && !isCorrectOption) {
                          optionStyle = 'border-red-300 bg-red-50 text-red-900 font-semibold';
                          icon = <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white flex-shrink-0"><XCircle size={12} /></div>;
                        }

                        return (
                          <div
                            key={oIdx}
                            className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-4 text-sm ${optionStyle}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                isCorrectOption ? 'bg-green-200 text-green-800' :
                                isSelectedByStudent ? 'bg-red-200 text-red-800' :
                                'bg-slate-100 text-slate-400'
                              }`}>
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span>{option}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isSelectedByStudent && (
                                <span className="text-[10px] uppercase font-bold text-slate-400">Escolha do aluno</span>
                              )}
                              {icon}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-8 bg-slate-50 border-t flex justify-end flex-shrink-0">
              <button
                onClick={() => setSelectedSubmissionForGabarito(null)}
                className="px-8 py-3 bg-emcn-blue text-white rounded-2xl font-bold hover:bg-slate-800 transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamSubmissionsPage;
