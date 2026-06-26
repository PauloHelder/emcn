
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, BookOpen, Layers, Edit, Trash2, FileText, Target, ChevronRight, X, Check, AlertCircle, Power } from 'lucide-react';
import { ClassGroup, Discipline, Exam, School, Question, QuestionType } from '../types';
import { supabase } from '../supabase';

interface ExamsPageProps {
  classes: ClassGroup[];
  disciplines: Discipline[];
  schools: School[];
}

const ExamsPage: React.FC<ExamsPageProps> = ({ classes, disciplines, schools }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [questionFormData, setQuestionFormData] = useState<Question>({
    text: '',
    type: 'SINGLE_CHOICE',
    options: ['', '', '', ''],
    correctIndex: 0,
    correctIndices: [0]
  });
  
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    subject: '',
    schoolId: '',
    classId: '',
    disciplineId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxScore: 10
  });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('exams').select('*').order('date', { ascending: false });
      if (error) throw error;
      setExams(data.map((e: any) => ({
        ...e,
        classId: e.class_id,
        disciplineId: e.discipline_id,
        dueDate: e.due_date,
        maxScore: e.max_score
      })));
    } catch (err: any) {
      alert('Erro ao buscar provas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        subject: formData.subject,
        class_id: formData.classId,
        discipline_id: formData.disciplineId,
        date: formData.date,
        due_date: formData.dueDate,
        max_score: formData.maxScore
      };

      if (formData.id) {
        const { error } = await supabase.from('exams').update(payload).eq('id', formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('exams').insert([payload]);
        if (error) throw error;
      }

      setShowForm(false);
      setFormData({
        id: '',
        title: '',
        subject: '',
        schoolId: '',
        classId: '',
        disciplineId: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maxScore: 10
      });
      fetchExams();
    } catch (err: any) {
      alert('Erro ao salvar prova: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta prova?')) return;
    try {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      if (error) throw error;
      fetchExams();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const handleToggleStatus = async (exam: Exam) => {
    const newStatus = exam.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    if (!window.confirm(`Tem certeza que deseja ${newStatus === 'ACTIVE' ? 'ATIVAR' : 'DESATIVAR'} esta prova? ${newStatus === 'ACTIVE' ? 'Ela ficará visível para os alunos realizarem.' : ''}`)) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('exams').update({ status: newStatus }).eq('id', exam.id);
      if (error) throw error;
      setExams(prev => prev.map(e => e.id === exam.id ? { ...e, status: newStatus } : e));
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;
    
    if (questionFormData.options.length < 2 || questionFormData.options.length > 5) {
      alert("A questão deve ter entre 2 e 5 opções.");
      return;
    }
    if (questionFormData.options.some(opt => !opt.trim())) {
      alert("Todas as opções devem ser preenchidas.");
      return;
    }
    if (questionFormData.type === 'MULTIPLE_CHOICE' && (!questionFormData.correctIndices || questionFormData.correctIndices.length === 0)) {
      alert("Selecione pelo menos uma alternativa correta para a questão de Múltipla Escolha.");
      return;
    }

    setLoading(true);
    try {
      let updatedQuestions = [...(selectedExam.questions || [])];
      
      const normalizedQuestion: Question = {
        text: questionFormData.text,
        type: questionFormData.type || 'SINGLE_CHOICE',
        options: questionFormData.options,
        correctIndex: questionFormData.type === 'MULTIPLE_CHOICE' ? undefined : (questionFormData.correctIndex ?? 0),
        correctIndices: questionFormData.type === 'MULTIPLE_CHOICE' ? (questionFormData.correctIndices || []) : undefined
      };

      if (editingQuestionIndex !== null) {
        updatedQuestions[editingQuestionIndex] = normalizedQuestion;
      } else {
        updatedQuestions.push(normalizedQuestion);
      }

      const { error } = await supabase.from('exams').update({ questions: updatedQuestions }).eq('id', selectedExam.id);
      if (error) throw error;

      const newExam = { ...selectedExam, questions: updatedQuestions };
      setSelectedExam(newExam);
      setExams(prev => prev.map(ex => ex.id === newExam.id ? newExam : ex));
      
      setShowQuestionForm(false);
      setEditingQuestionIndex(null);
      setQuestionFormData({ text: '', type: 'SINGLE_CHOICE', options: ['', '', '', ''], correctIndex: 0, correctIndices: [0] });
    } catch (err: any) {
      alert('Erro ao salvar questão: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (index: number) => {
    if (!selectedExam || !window.confirm('Excluir esta questão?')) return;
    setLoading(true);
    try {
      const updatedQuestions = selectedExam.questions!.filter((_, i) => i !== index);
      const { error } = await supabase.from('exams').update({ questions: updatedQuestions }).eq('id', selectedExam.id);
      if (error) throw error;
      
      const newExam = { ...selectedExam, questions: updatedQuestions };
      setSelectedExam(newExam);
      setExams(prev => prev.map(ex => ex.id === newExam.id ? newExam : ex));
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = exams.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClassName = (id: string) => classes.find(c => c.id === id)?.name || 'Turma não encontrada';
  const getDisciplineName = (id: string) => disciplines.find(d => d.id === id)?.name || 'Disciplina não encontrada';

  const availableClasses = formData.schoolId 
    ? classes.filter(c => c.schoolId === formData.schoolId) 
    : [];

  const selectedClassDetails = classes.find(c => c.id === formData.classId);
  const availableDisciplines = selectedClassDetails
    ? disciplines.filter(d => selectedClassDetails.sessions.some(s => s.disciplineId === d.id))
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[32px] border shadow-sm">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Gestão de Provas</h2>
          <p className="text-slate-500 mt-1">Crie e gerencie as avaliações de todas as turmas.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-8 py-3.5 bg-emcn-blue text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 shadow-xl shadow-emcn-blue/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          <Plus size={20} /> Nova Prova
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emcn-gold transition-colors" size={20} />
          <input
            type="text"
            placeholder="Buscar por título ou matéria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-emcn-gold outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExams.map(exam => (
          <div key={exam.id} className="bg-white rounded-[32px] border-2 border-slate-50 overflow-hidden hover:border-emcn-gold/30 hover:shadow-xl transition-all group">
            <div className="p-8">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-emcn-gold/10 rounded-2xl flex items-center justify-center text-emcn-gold group-hover:scale-110 transition-transform">
                  <FileText size={24} />
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleToggleStatus(exam)} 
                    title={exam.status === 'ACTIVE' ? "Desativar Prova" : "Ativar Prova"}
                    className={`p-2 rounded-xl transition-colors ${exam.status === 'ACTIVE' ? 'text-green-500 hover:bg-green-50' : 'text-slate-400 hover:text-green-500 hover:bg-green-50'}`}
                  >
                    <Power size={18} />
                  </button>
                  <button onClick={() => { setFormData({ ...exam, schoolId: classes.find(c => c.id === exam.classId)?.schoolId || '' } as any); setShowForm(true); }} className="p-2 text-slate-400 hover:text-emcn-blue hover:bg-slate-50 rounded-xl transition-colors">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(exam.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-slate-800">{exam.title}</h3>
                <span className={`px-2 py-0.5 text-[10px] font-black tracking-wider rounded-md uppercase ${exam.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {exam.status === 'ACTIVE' ? 'Ativa' : 'Rascunho'}
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-6 font-medium line-clamp-2">{exam.subject || 'Sem matéria especificada'}</p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <Layers size={16} className="text-emcn-gold" />
                  <span className="font-semibold">{getClassName(exam.classId)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <BookOpen size={16} className="text-emcn-gold" />
                  <span>{getDisciplineName(exam.disciplineId)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-4 px-1">
                  <Calendar size={14} /> 
                  <span>Aplicação: {new Date(exam.date).toLocaleDateString()}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span>Limite: {new Date(exam.dueDate || '').toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => { setSelectedExam(exam); setShowQuestionsModal(true); }}
              className="px-8 py-5 bg-slate-50/50 border-t flex justify-between items-center w-full hover:bg-emcn-blue/5 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Target size={16} className="text-emcn-gold" />
                <span className="text-xs font-bold text-slate-500">Nota Máxima: {exam.maxScore}</span>
              </div>
              <div className="flex items-center gap-1 text-emcn-blue text-xs font-bold group-hover:gap-2 transition-all">
                 Questões ({exam.questions?.length || 0}) <ChevronRight size={14} />
              </div>
            </button>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto py-10">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
            <div className="bg-emcn-blue p-8 text-white relative">
              <h3 className="text-2xl font-serif">{formData.id ? 'Editar Prova' : 'Criar Nova Prova'}</h3>
              <p className="text-white/60 text-sm mt-1">Preencha todos os campos para configurar a avaliação.</p>
              <button onClick={() => setShowForm(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Título da Prova</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emcn-gold focus:bg-white rounded-2xl outline-none transition-all font-medium"
                    placeholder="Ex: P1 - Introdução ao Antigo Testamento"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Matéria / Conteúdo</label>
                  <input
                    required
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emcn-gold focus:bg-white rounded-2xl outline-none transition-all font-medium"
                    placeholder="Ex: Gênesis, Êxodo e Levítico"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Escola / Unidade</label>
                  <select
                    required
                    value={formData.schoolId}
                    onChange={(e) => setFormData({ ...formData, schoolId: e.target.value, classId: '', disciplineId: '' })}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emcn-gold focus:bg-white rounded-2xl outline-none transition-all font-medium appearance-none"
                  >
                    <option value="">Selecione a Escola</option>
                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Turma</label>
                  <select
                    required
                    disabled={!formData.schoolId}
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value, disciplineId: '' })}
                    className={`w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emcn-gold focus:bg-white rounded-2xl outline-none transition-all font-medium appearance-none ${!formData.schoolId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Selecione a Turma</option>
                    {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Disciplina</label>
                  <select
                    required
                    disabled={!formData.classId}
                    value={formData.disciplineId}
                    onChange={(e) => setFormData({ ...formData, disciplineId: e.target.value })}
                    className={`w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emcn-gold focus:bg-white rounded-2xl outline-none transition-all font-medium appearance-none ${!formData.classId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Selecione a Disciplina</option>
                    {availableDisciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  {formData.classId && availableDisciplines.length === 0 && (
                    <p className="text-xs text-red-500 font-medium">Nenhuma disciplina vinculada nas aulas desta turma.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Data da Realização</label>
                  <input
                    required
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emcn-gold focus:bg-white rounded-2xl outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Data Limite (Online)</label>
                  <input
                    required
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emcn-gold focus:bg-white rounded-2xl outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-2 px-12 py-4 bg-emcn-gold text-emcn-blue rounded-2xl font-bold hover:bg-[#b08e4d] transition-all shadow-lg shadow-emcn-gold/20 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : 'Salvar Prova'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQuestionsModal && selectedExam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto py-10">
          <div className="bg-white rounded-[40px] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto flex flex-col max-h-[85vh]">
            <div className="bg-emcn-blue p-8 text-white relative flex-shrink-0">
              <h3 className="text-2xl font-serif">Questões: {selectedExam.title}</h3>
              <p className="text-white/60 text-sm mt-1">Gerencie as perguntas de múltipla escolha desta prova.</p>
              <button onClick={() => setShowQuestionsModal(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 bg-slate-50">
              {!showQuestionForm ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-800">
                      Total de Questões: {selectedExam.questions?.length || 0}
                    </h4>
                    <button
                      onClick={() => {
                        setQuestionFormData({ text: '', type: 'SINGLE_CHOICE', options: ['', '', '', ''], correctIndex: 0, correctIndices: [0] });
                        setEditingQuestionIndex(null);
                        setShowQuestionForm(true);
                      }}
                      className="px-5 py-2.5 bg-emcn-gold text-emcn-blue rounded-xl font-bold flex items-center gap-2 hover:bg-[#b08e4d] shadow-md transition-all"
                    >
                      <Plus size={18} /> Adicionar Questão
                    </button>
                  </div>

                  {(!selectedExam.questions || selectedExam.questions.length === 0) ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
                      <FileText size={48} className="text-slate-300 mx-auto mb-4" />
                      <h4 className="text-lg font-bold text-slate-800 mb-1">Nenhuma questão cadastrada</h4>
                      <p className="text-slate-500 text-sm">Adicione questões para esta prova.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedExam.questions.map((q, idx) => {
                        const qType = q.type || 'SINGLE_CHOICE';
                        return (
                          <div key={idx} className="bg-white p-6 rounded-3xl border shadow-sm">
                            <div className="flex justify-between items-start gap-4 mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2 py-0.5 text-[9px] font-black tracking-wider rounded-md uppercase ${
                                    qType === 'TRUE_FALSE' ? 'bg-blue-100 text-blue-800' :
                                    qType === 'MULTIPLE_CHOICE' ? 'bg-amber-100 text-amber-800' :
                                    'bg-slate-100 text-slate-800'
                                  }`}>
                                    {qType === 'TRUE_FALSE' ? 'Verdadeiro ou Falso' :
                                     qType === 'MULTIPLE_CHOICE' ? 'Múltipla Escolha' :
                                     'Escolha Única'}
                                  </span>
                                </div>
                                <h5 className="font-bold text-slate-800 text-lg">
                                  <span className="text-emcn-gold mr-2">{idx + 1}.</span> {q.text}
                                </h5>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <button
                                  onClick={() => {
                                    setQuestionFormData({
                                      text: q.text,
                                      type: qType,
                                      options: q.options,
                                      correctIndex: q.correctIndex ?? 0,
                                      correctIndices: q.correctIndices || []
                                    });
                                    setEditingQuestionIndex(idx);
                                    setShowQuestionForm(true);
                                  }}
                                  className="p-2 text-slate-400 hover:text-emcn-blue hover:bg-slate-50 rounded-xl transition-colors"
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestion(idx)}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {q.options.map((opt, optIdx) => {
                                const isCorrect = qType === 'MULTIPLE_CHOICE'
                                  ? q.correctIndices?.includes(optIdx)
                                  : q.correctIndex === optIdx;
                                return (
                                  <div 
                                    key={optIdx} 
                                    className={`p-3 rounded-xl border text-sm flex items-center gap-3 ${
                                      isCorrect 
                                        ? 'bg-green-50 border-green-200 text-green-800 font-semibold' 
                                        : 'bg-slate-50 border-slate-100 text-slate-600'
                                    }`}
                                  >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                                      isCorrect ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
                                    }`}>
                                      {String.fromCharCode(65 + optIdx)}
                                    </div>
                                    <span>{opt}</span>
                                    {isCorrect && <Check size={16} className="ml-auto text-green-600" />}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSaveQuestion} className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
                  <div className="flex items-center gap-3 text-emcn-blue font-bold text-lg mb-2">
                    <button type="button" onClick={() => setShowQuestionForm(false)} className="hover:bg-slate-100 p-2 rounded-lg -ml-2">
                      <ChevronRight size={20} className="rotate-180" />
                    </button>
                    {editingQuestionIndex !== null ? 'Editar Questão' : 'Nova Questão'}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Enunciado da Questão</label>
                    <textarea
                      required
                      rows={3}
                      value={questionFormData.text}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, text: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emcn-gold focus:bg-white rounded-2xl outline-none transition-all font-medium resize-none"
                      placeholder="Ex: Qual é o primeiro livro da Bíblia?"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Pergunta</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'] as QuestionType[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            let newOpts = [...questionFormData.options];
                            if (t === 'TRUE_FALSE') {
                              newOpts = ['Verdadeiro', 'Falso'];
                            } else {
                              if (newOpts.length < 2) newOpts = ['', ''];
                              if (newOpts.length > 5) newOpts = newOpts.slice(0, 5);
                              if (newOpts.length === 2 && newOpts[0] === 'Verdadeiro' && newOpts[1] === 'Falso') {
                                newOpts = ['', '', '', ''];
                              }
                            }
                            setQuestionFormData({
                              ...questionFormData,
                              type: t,
                              options: newOpts,
                              correctIndex: t === 'TRUE_FALSE' ? 0 : questionFormData.correctIndex ?? 0,
                              correctIndices: t === 'MULTIPLE_CHOICE' ? [0] : []
                            });
                          }}
                          className={`px-4 py-3.5 rounded-2xl border-2 font-bold text-xs transition-all ${
                            (questionFormData.type || 'SINGLE_CHOICE') === t
                              ? 'bg-emcn-blue border-emcn-blue text-white shadow-lg shadow-emcn-blue/20'
                              : 'bg-slate-50 border-transparent text-slate-500 hover:border-slate-200'
                          }`}
                        >
                          {t === 'SINGLE_CHOICE' && 'Escolha Única'}
                          {t === 'MULTIPLE_CHOICE' && 'Múltiplas Escolhas'}
                          {t === 'TRUE_FALSE' && 'Verdadeiro ou Falso'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {questionFormData.type === 'TRUE_FALSE' ? (
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Gabarito da Questão</label>
                      {['Verdadeiro', 'Falso'].map((label, idx) => {
                        const isCorrect = questionFormData.correctIndex === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setQuestionFormData({ ...questionFormData, correctIndex: idx })}
                            className={`w-full p-5 rounded-2xl border-2 text-left font-bold transition-all flex items-center justify-between ${
                              isCorrect
                                ? 'bg-green-50 border-green-500 text-green-800 shadow-sm'
                                : 'bg-slate-50 border-transparent text-slate-500 hover:border-slate-200'
                            }`}
                          >
                            <span>{label}</span>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                              isCorrect ? 'bg-green-500 border-green-500 text-white scale-110' : 'border-slate-300 bg-white'
                            }`}>
                              {isCorrect && <Check size={16} strokeWidth={4} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Opções de Resposta</label>
                        {questionFormData.options.length < 5 && (
                          <button
                            type="button"
                            onClick={() => {
                              setQuestionFormData({
                                ...questionFormData,
                                options: [...questionFormData.options, '']
                              });
                            }}
                            className="text-xs font-bold text-emcn-gold hover:text-slate-800 transition-colors flex items-center gap-1"
                          >
                            <Plus size={14} /> Adicionar Opção
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {questionFormData.options.map((opt, idx) => {
                          const isMultiple = questionFormData.type === 'MULTIPLE_CHOICE';
                          const isCorrect = isMultiple
                            ? questionFormData.correctIndices?.includes(idx)
                            : questionFormData.correctIndex === idx;

                          return (
                            <div key={idx} className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isMultiple) {
                                    const currentIndices = questionFormData.correctIndices || [];
                                    const newIndices = currentIndices.includes(idx)
                                      ? currentIndices.filter(i => i !== idx)
                                      : [...currentIndices, idx];
                                    setQuestionFormData({ ...questionFormData, correctIndices: newIndices });
                                  } else {
                                    setQuestionFormData({ ...questionFormData, correctIndex: idx });
                                  }
                                }}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all font-bold ${
                                  isCorrect
                                    ? 'bg-green-500 text-white shadow-md shadow-green-500/20 scale-105'
                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                                title={isMultiple ? "Marcar como uma das corretas" : "Marcar como correta"}
                              >
                                {String.fromCharCode(65 + idx)}
                              </button>
                              <input
                                required
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...questionFormData.options];
                                  newOpts[idx] = e.target.value;
                                  setQuestionFormData({ ...questionFormData, options: newOpts });
                                }}
                                className={`flex-1 px-5 py-3 border-2 rounded-xl outline-none transition-all font-medium ${
                                  isCorrect
                                    ? 'bg-green-50/30 border-green-200 focus:border-green-500'
                                    : 'bg-slate-50 border-transparent focus:border-emcn-gold focus:bg-white'
                                }`}
                                placeholder={`Opção ${String.fromCharCode(65 + idx)}`}
                              />
                              {questionFormData.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOpts = questionFormData.options.filter((_, i) => i !== idx);
                                    let newCorrectIndex = questionFormData.correctIndex ?? 0;
                                    if (newCorrectIndex >= newOpts.length) {
                                      newCorrectIndex = newOpts.length - 1;
                                    }
                                    const newCorrectIndices = (questionFormData.correctIndices || [])
                                      .filter(i => i !== idx)
                                      .map(i => (i > idx ? i - 1 : i));

                                    setQuestionFormData({
                                      ...questionFormData,
                                      options: newOpts,
                                      correctIndex: newCorrectIndex,
                                      correctIndices: newCorrectIndices
                                    });
                                  }}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                  title="Remover opção"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 bg-blue-50 text-blue-800 p-3 rounded-lg">
                        <AlertCircle size={14} />
                        <span>
                          {questionFormData.type === 'MULTIPLE_CHOICE'
                            ? "Clique na letra (A, B, C...) para marcar uma ou mais opções corretas (Checkboxes)."
                            : "Clique na letra (A, B, C...) para definir a única opção correta (Rádio)."}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowQuestionForm(false)}
                      className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-2 px-12 py-4 bg-emcn-gold text-emcn-blue rounded-2xl font-bold hover:bg-[#b08e4d] transition-all shadow-lg shadow-emcn-gold/20 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 size={20} className="animate-spin" /> : 'Salvar Questão'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Loader2 = ({ size, className }: any) => (
  <svg 
    width={size} 
    height={size} 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default ExamsPage;
