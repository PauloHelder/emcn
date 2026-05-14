
import React, { useState, useEffect } from 'react';
import { Discipline, Exam, Grade, Student } from '../types';
import { 
  Plus, BookOpen, Clock, Trash2, Edit, X, Loader2, 
  FileText, Calendar, Award, ChevronRight, AlertCircle, Save
} from 'lucide-react';
import { supabase } from '../supabase';

interface DisciplinesPageProps {
  disciplines: Discipline[];
  setDisciplines: React.Dispatch<React.SetStateAction<Discipline[]>>;
  students: Student[];
}

const DisciplinesPage: React.FC<DisciplinesPageProps> = ({ disciplines, setDisciplines, students }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Discipline>>({});
  
  // Exam management state
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [showExamForm, setShowExamForm] = useState(false);
  const [examFormData, setExamFormData] = useState<Partial<Exam>>({});
  
  // Grade management state
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [editingGrades, setEditingGrades] = useState<Record<string, number>>({});

  useEffect(() => {
    if (selectedDiscipline) {
      fetchExams(selectedDiscipline.id);
    }
  }, [selectedDiscipline]);

  useEffect(() => {
    if (selectedExam) {
      fetchGrades(selectedExam.id);
    }
  }, [selectedExam]);

  const fetchExams = async (disciplineId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('discipline_id', disciplineId);
      
      if (error) throw error;
      setExams(data.map((e: any) => ({
        ...e,
        disciplineId: e.discipline_id,
        maxScore: e.max_score
      })));
    } catch (err: any) {
      alert('Erro ao carregar provas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGrades = async (examId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .eq('exam_id', examId);
      
      if (error) throw error;
      const mappedGrades = data.map((g: any) => ({
        ...g,
        examId: g.exam_id,
        studentId: g.student_id
      }));
      setGrades(mappedGrades);
      
      // Initialize editing state
      const gradeMap: Record<string, number> = {};
      mappedGrades.forEach((g: Grade) => {
        gradeMap[g.studentId] = g.score;
      });
      setEditingGrades(gradeMap);
    } catch (err: any) {
      alert('Erro ao carregar notas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDiscipline = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formData.id) {
        const { data, error } = await supabase
          .from('disciplines')
          .update({
            name: formData.name,
            description: formData.description,
            workload: formData.workload
          })
          .eq('id', formData.id)
          .select()
          .single();

        if (error) throw error;
        setDisciplines(prev => prev.map(d => d.id === formData.id ? (data as Discipline) : d));
      } else {
        const { data, error } = await supabase
          .from('disciplines')
          .insert([{
            name: formData.name,
            description: formData.description,
            workload: formData.workload
          }])
          .select()
          .single();

        if (error) throw error;
        setDisciplines(prev => [...prev, data as Discipline]);
      }
      setShowForm(false);
      setFormData({});
    } catch (err: any) {
      alert('Erro ao salvar disciplina: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDiscipline = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta disciplina? Todas as provas relacionadas também serão excluídas.')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('disciplines').delete().eq('id', id);
      if (error) throw error;
      setDisciplines(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiscipline) return;
    setLoading(true);
    try {
      const payload = {
        discipline_id: selectedDiscipline.id,
        title: examFormData.title,
        description: examFormData.description,
        date: examFormData.date,
        max_score: examFormData.maxScore || 10
      };

      if (examFormData.id) {
        const { error } = await supabase
          .from('exams')
          .update(payload)
          .eq('id', examFormData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('exams')
          .insert([payload]);
        if (error) throw error;
      }
      
      fetchExams(selectedDiscipline.id);
      setShowExamForm(false);
      setExamFormData({});
    } catch (err: any) {
      alert('Erro ao salvar prova: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm('Excluir esta prova e todas as notas lançadas?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      if (error) throw error;
      setExams(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      alert('Erro ao excluir prova: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGrades = async () => {
    if (!selectedExam) return;
    setLoading(true);
    try {
      const gradeEntries = Object.entries(editingGrades).map(([studentId, score]) => ({
        exam_id: selectedExam.id,
        student_id: studentId,
        score: score
      }));

      // Delete existing grades for this exam and insert new ones (simpler than upserting individually)
      await supabase.from('grades').delete().eq('exam_id', selectedExam.id);
      
      const { error } = await supabase.from('grades').insert(gradeEntries);
      if (error) throw error;
      
      alert('Notas salvas com sucesso!');
      setSelectedExam(null);
    } catch (err: any) {
      alert('Erro ao salvar notas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Disciplinas</h2>
        <button onClick={() => { setFormData({}); setShowForm(true); }} className="px-4 py-2 bg-emcn-blue text-white rounded-lg flex items-center gap-2 font-semibold shadow-md hover:bg-slate-800 transition-colors">
          <Plus size={18} /> Nova Disciplina
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {disciplines.map(discipline => (
          <div key={discipline.id} className="bg-white p-6 rounded-2xl border shadow-sm group hover:border-emcn-gold transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emcn-gold/10 text-emcn-gold rounded-xl group-hover:bg-emcn-gold group-hover:text-white transition-colors">
                <BookOpen size={24} />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setFormData(discipline); setShowForm(true); }}
                  className="p-1.5 text-slate-400 hover:text-emcn-blue hover:bg-slate-50 rounded transition-all"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDeleteDiscipline(discipline.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{discipline.name}</h3>
            <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{discipline.description || 'Sem descrição.'}</p>
            
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 bg-slate-50 p-2 rounded-lg mb-4">
              <Clock size={16} className="text-emcn-gold" />
              Carga Horária: {discipline.workload} horas
            </div>

            <button 
              onClick={() => setSelectedDiscipline(discipline)}
              className="w-full py-2.5 border-2 border-emcn-gold/20 text-emcn-gold font-bold rounded-xl hover:bg-emcn-gold hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <FileText size={18} /> Gerenciar Provas
            </button>
          </div>
        ))}
      </div>

      {/* Exams Management Modal */}
      {selectedDiscipline && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-emcn-blue p-8 text-white flex justify-between items-center shrink-0">
              <div>
                <div className="text-[10px] font-black text-emcn-gold uppercase tracking-[0.2em] mb-1">Gerenciamento Acadêmico</div>
                <h3 className="text-2xl font-bold">Provas: {selectedDiscipline.name}</h3>
              </div>
              <button onClick={() => setSelectedDiscipline(null)} className="hover:bg-white/10 p-2 rounded-xl transition-colors"><X /></button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-slate-800">Avaliações Cadastradas</h4>
                <button 
                  onClick={() => { setExamFormData({}); setShowExamForm(true); }}
                  className="px-4 py-2 bg-emcn-gold text-white rounded-lg font-bold flex items-center gap-2 text-sm shadow-lg shadow-emcn-gold/20"
                >
                  <Plus size={16} /> Nova Prova
                </button>
              </div>

              <div className="space-y-4">
                {exams.map(exam => (
                  <div key={exam.id} className="bg-slate-50 p-6 rounded-2xl border-2 border-transparent hover:border-emcn-gold/30 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emcn-gold shadow-sm">
                        <Award size={24} />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-800">{exam.title}</h5>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(exam.date).toLocaleDateString()}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <span>Nota Máxima: {exam.maxScore}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => setSelectedExam(exam)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-emcn-blue text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all"
                      >
                        Lançar Notas
                      </button>
                      <button 
                        onClick={() => { setExamFormData(exam); setShowExamForm(true); }}
                        className="p-2 text-slate-400 hover:text-emcn-blue hover:bg-white rounded-lg transition-all"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteExam(exam.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {exams.length === 0 && (
                  <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Nenhuma prova cadastrada para esta disciplina.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exam Form Modal */}
      {showExamForm && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-emcn-gold p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">{examFormData.id ? 'Editar Prova' : 'Nova Prova'}</h3>
              <button onClick={() => setShowExamForm(false)} className="hover:bg-white/10 p-1 rounded-lg"><X /></button>
            </div>
            <form onSubmit={handleSaveExam} className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Título da Avaliação</label>
                <input 
                  required 
                  value={examFormData.title || ''} 
                  onChange={(e) => setExamFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:border-emcn-gold outline-none"
                  placeholder="Ex: Prova Final de Módulo"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Data</label>
                  <input 
                    type="date" 
                    required 
                    value={examFormData.date || ''} 
                    onChange={(e) => setExamFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:border-emcn-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Nota Máxima</label>
                  <input 
                    type="number" 
                    required 
                    value={examFormData.maxScore || 10} 
                    onChange={(e) => setExamFormData(prev => ({ ...prev, maxScore: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:border-emcn-gold outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Instruções (Opcional)</label>
                <textarea 
                  rows={2}
                  value={examFormData.description || ''} 
                  onChange={(e) => setExamFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:border-emcn-gold outline-none"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowExamForm(false)} className="flex-1 py-3 text-slate-500 font-bold">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-emcn-gold text-white font-bold rounded-xl shadow-lg">Salvar Prova</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Entry Modal */}
      {selectedExam && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-emcn-blue p-8 text-white flex justify-between items-center shrink-0">
              <div>
                <div className="text-[10px] font-black text-emcn-gold uppercase tracking-[0.2em] mb-1">Lançamento de Notas</div>
                <h3 className="text-2xl font-bold">{selectedExam.title}</h3>
                <p className="text-white/60 text-xs mt-1">Nota máxima: {selectedExam.maxScore}</p>
              </div>
              <button onClick={() => setSelectedExam(null)} className="hover:bg-white/10 p-2 rounded-xl transition-colors"><X /></button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1">
              <div className="space-y-3">
                {[...students].sort((a, b) => a.name.localeCompare(b.name)).map(student => (
                  <div key={student.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-slate-200 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-slate-400 border border-slate-100 shadow-sm">
                        {student.name.charAt(0)}
                      </div>
                      <div className="font-bold text-slate-800">{student.name}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        min="0" 
                        max={selectedExam.maxScore}
                        step="0.1"
                        placeholder="0.0"
                        value={editingGrades[student.id] ?? ''}
                        onChange={(e) => setEditingGrades(prev => ({ ...prev, [student.id]: Number(e.target.value) }))}
                        className="w-20 px-3 py-2 border-2 border-slate-200 rounded-xl focus:border-emcn-gold outline-none text-center font-bold"
                      />
                      <span className="text-slate-300 font-medium">/ {selectedExam.maxScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-8 border-t bg-slate-50 flex gap-4 shrink-0">
              <button 
                onClick={() => setSelectedExam(null)} 
                className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all"
              >
                Descartar
              </button>
              <button 
                onClick={handleSaveGrades}
                className="flex-1 py-4 bg-green-600 text-white font-bold rounded-2xl shadow-xl shadow-green-200 flex items-center justify-center gap-2"
              >
                <Save size={20} /> Salvar Notas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discipline Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-emcn-blue p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Gerenciar Disciplina</h3>
              <button onClick={() => setShowForm(false)} disabled={loading} className="hover:bg-white/10 p-1 rounded-lg transition-colors"><X /></button>
            </div>
            <form onSubmit={handleSaveDiscipline} className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome da Disciplina</label>
                <input 
                  required 
                  disabled={loading} 
                  placeholder="Ex: Teologia Sistemática"
                  value={formData.name || ''} 
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:border-emcn-gold outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Descrição</label>
                <textarea 
                  rows={3} 
                  disabled={loading} 
                  placeholder="Sobre o que trata esta disciplina?"
                  value={formData.description || ''} 
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:border-emcn-gold outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Carga Horária (horas)</label>
                <input 
                  type="number" 
                  required 
                  disabled={loading} 
                  value={formData.workload || ''} 
                  onChange={(e) => setFormData(prev => ({ ...prev, workload: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:border-emcn-gold outline-none"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" disabled={loading} onClick={() => setShowForm(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-emcn-blue text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  {formData.id ? 'Atualizar' : 'Criar'} Disciplina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisciplinesPage;
