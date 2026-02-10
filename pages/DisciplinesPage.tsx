
import React, { useState } from 'react';
import { Discipline } from '../types';
import { Plus, BookOpen, Clock, Trash2, Edit, X, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

interface DisciplinesPageProps {
  disciplines: Discipline[];
  setDisciplines: React.Dispatch<React.SetStateAction<Discipline[]>>;
}

const DisciplinesPage: React.FC<DisciplinesPageProps> = ({ disciplines, setDisciplines }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Discipline>>({});

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formData.id) {
        // Update
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
        // Create
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

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta disciplina?')) return;

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Disciplinas</h2>
        <button onClick={() => { setFormData({}); setShowForm(true); }} className="px-4 py-2 bg-emcn-blue text-white rounded-lg flex items-center gap-2 font-semibold shadow-md hover:bg-slate-800 transition-colors">
          <Plus size={18} /> Nova Disciplina
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {disciplines.length > 0 ? disciplines.map(discipline => (
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
                  onClick={() => handleDelete(discipline.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{discipline.name}</h3>
            <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{discipline.description || 'Sem descrição.'}</p>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 bg-slate-50 p-2 rounded-lg">
              <Clock size={16} className="text-emcn-gold" />
              Carga Horária: {discipline.workload} horas
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
            <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Nenhuma disciplina cadastrada.</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-emcn-blue p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Gerenciar Disciplina</h3>
              <button
                onClick={() => setShowForm(false)}
                disabled={loading}
                className="hover:bg-white/10 p-1 rounded-lg transition-colors"
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome da Disciplina</label>
                <input
                  required
                  disabled={loading}
                  placeholder="Ex: Teologia Sistemática"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:border-emcn-gold outline-none transition-all"
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
                  className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:border-emcn-gold outline-none transition-all"
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
                  className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:border-emcn-gold outline-none transition-all"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-emcn-blue text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
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
