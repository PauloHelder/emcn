
import React, { useState } from 'react';
import { Discipline } from '../types';
import { Plus, BookOpen, Clock, Trash2, Edit, X } from 'lucide-react';

interface DisciplinesPageProps {
  disciplines: Discipline[];
  setDisciplines: React.Dispatch<React.SetStateAction<Discipline[]>>;
}

const DisciplinesPage: React.FC<DisciplinesPageProps> = ({ disciplines, setDisciplines }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Discipline>>({});

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id) {
      setDisciplines(prev => prev.map(d => d.id === formData.id ? { ...d, ...formData } as Discipline : d));
    } else {
      const newDiscipline: Discipline = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
      } as Discipline;
      setDisciplines(prev => [...prev, newDiscipline]);
    }
    setShowForm(false);
    setFormData({});
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Disciplinas</h2>
        <button onClick={() => { setFormData({}); setShowForm(true); }} className="px-4 py-2 bg-emcn-blue text-white rounded-lg flex items-center gap-2 font-semibold">
          <Plus size={18} /> Nova Disciplina
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {disciplines.length > 0 ? disciplines.map(discipline => (
          <div key={discipline.id} className="bg-white p-6 rounded-2xl border shadow-sm group hover:border-emcn-gold transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emcn-gold/10 text-emcn-gold rounded-xl">
                <BookOpen size={24} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setFormData(discipline); setShowForm(true); }} className="p-1.5 text-slate-400 hover:text-emcn-blue hover:bg-slate-50 rounded"><Edit size={16} /></button>
                <button onClick={() => setDisciplines(prev => prev.filter(d => d.id !== discipline.id))} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{discipline.name}</h3>
            <p className="text-sm text-slate-500 line-clamp-2 mb-4">{discipline.description}</p>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
              <Clock size={16} />
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
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-emcn-blue p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Gerenciar Disciplina</h3>
              <button onClick={() => setShowForm(false)} className="hover:bg-white/10 p-1 rounded-lg"><X /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome da Disciplina</label>
                <input required value={formData.name || ''} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Descrição</label>
                <textarea rows={3} value={formData.description || ''} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Carga Horária (horas)</label>
                <input type="number" required value={formData.workload || ''} onChange={(e) => setFormData(prev => ({ ...prev, workload: Number(e.target.value) }))} className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 text-slate-600 font-bold">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-emcn-blue text-white font-bold rounded-xl shadow-lg">Salvar Disciplina</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisciplinesPage;
