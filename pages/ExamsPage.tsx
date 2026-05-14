
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, BookOpen, Layers, Edit, Trash2, FileText, Target, ChevronRight } from 'lucide-react';
import { ClassGroup, Discipline, Exam } from '../types';
import { supabase } from '../supabase';

interface ExamsPageProps {
  classes: ClassGroup[];
  disciplines: Discipline[];
}

const ExamsPage: React.FC<ExamsPageProps> = ({ classes, disciplines }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    subject: '',
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
    if (!confirm('Tem certeza que deseja excluir esta prova?')) return;
    try {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      if (error) throw error;
      fetchExams();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const filteredExams = exams.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClassName = (id: string) => classes.find(c => c.id === id)?.name || 'Turma não encontrada';
  const getDisciplineName = (id: string) => disciplines.find(d => d.id === id)?.name || 'Disciplina não encontrada';

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
                  <button onClick={() => { setFormData({ ...exam }); setShowForm(true); }} className="p-2 text-slate-400 hover:text-emcn-blue hover:bg-slate-50 rounded-xl transition-colors">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(exam.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-2">{exam.title}</h3>
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
            
            <div className="px-8 py-5 bg-slate-50/50 border-t flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-emcn-gold" />
                <span className="text-xs font-bold text-slate-500">Nota Máxima: {exam.maxScore}</span>
              </div>
              <div className="flex items-center gap-1 text-emcn-blue text-xs font-bold group-hover:gap-2 transition-all">
                 Questões <ChevronRight size={14} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-emcn-blue p-8 text-white relative">
              <h3 className="text-2xl font-serif">{formData.id ? 'Editar Prova' : 'Criar Nova Prova'}</h3>
              <p className="text-white/60 text-sm mt-1">Preencha todos os campos para configurar a avaliação.</p>
              <button onClick={() => setShowForm(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
                <Plus size={24} className="rotate-45" />
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
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Turma</label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emcn-gold focus:bg-white rounded-2xl outline-none transition-all font-medium appearance-none"
                  >
                    <option value="">Selecione a Turma</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Disciplina</label>
                  <select
                    required
                    value={formData.disciplineId}
                    onChange={(e) => setFormData({ ...formData, disciplineId: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emcn-gold focus:bg-white rounded-2xl outline-none transition-all font-medium appearance-none"
                  >
                    <option value="">Selecione a Disciplina</option>
                    {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
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
