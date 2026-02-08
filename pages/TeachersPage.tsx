
import React, { useState } from 'react';
import { Teacher } from '../types';
import { Plus, Search, MoreHorizontal, Edit, Trash2, X, ChevronRight, Mail, Book } from 'lucide-react';

interface TeachersPageProps {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
}

const TeachersPage: React.FC<TeachersPageProps> = ({ teachers, setTeachers }) => {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Teacher>>({ specialties: [] });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id) {
      setTeachers(prev => prev.map(t => t.id === formData.id ? { ...t, ...formData } as Teacher : t));
    } else {
      const newTeacher: Teacher = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        role: 'TEACHER',
        specialties: formData.specialties || []
      } as Teacher;
      setTeachers(prev => [...prev, newTeacher]);
    }
    setShowForm(false);
    setFormData({ specialties: [] });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este professor?')) {
      setTeachers(prev => prev.filter(t => t.id !== id));
      if (selectedTeacher?.id === id) setSelectedTeacher(null);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* List Column */}
      <div className={`${selectedTeacher ? 'hidden lg:block' : 'lg:col-span-3'} space-y-6`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800">Professores</h2>
          <button
            onClick={() => { setFormData({ specialties: [] }); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-emcn-blue text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold"
          >
            <Plus size={18} /> Novo Professor
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou especialidade..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-emcn-blue outline-none transition-all"
          />
        </div>

        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-slate-500 text-sm font-semibold uppercase">
              <tr>
                <th className="px-6 py-4">Professor</th>
                <th className="px-6 py-4 hidden md:table-cell">Especialidades</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {teachers.length > 0 ? teachers.map(teacher => (
                <tr
                  key={teacher.id}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedTeacher(teacher)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emcn-gold/10 text-emcn-gold flex items-center justify-center font-bold">
                        {teacher.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{teacher.name}</div>
                        <div className="text-sm text-slate-500">{teacher.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {teacher.specialties.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-xs font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setFormData(teacher); setShowForm(true); }}
                        className="p-1.5 text-slate-400 hover:text-emcn-blue hover:bg-slate-100 rounded-lg transition-all"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(teacher.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                      <ChevronRight className="text-slate-300 ml-2" size={20} />
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-slate-500">Nenhum professor cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Column */}
      {selectedTeacher && (
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border rounded-2xl shadow-sm p-8 sticky top-24">
            <button
              onClick={() => setSelectedTeacher(null)}
              className="lg:hidden mb-4 flex items-center gap-1 text-emcn-blue font-medium"
            >
              Voltar para lista
            </button>
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-24 h-24 rounded-full bg-emcn-blue text-white text-3xl flex items-center justify-center font-serif mb-4 border-4 border-emcn-gold/20 shadow-xl">
                {selectedTeacher.name.charAt(0)}
              </div>
              <h2 className="text-2xl font-bold text-slate-800">{selectedTeacher.name}</h2>
              <div className="text-emcn-gold font-medium uppercase tracking-widest text-xs mt-1">Professor Escalonado</div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <Mail className="text-slate-400 shrink-0" size={20} />
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">E-mail</div>
                  <div className="text-slate-700">{selectedTeacher.email}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Book className="text-slate-400 shrink-0" size={20} />
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">Bio & Especialidades</div>
                  <div className="text-slate-700 text-sm mt-1 leading-relaxed">{selectedTeacher.bio}</div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedTeacher.specialties.map(s => (
                      <span key={s} className="px-3 py-1 bg-emcn-gold/10 text-emcn-gold rounded-full text-xs font-bold border border-emcn-gold/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t flex gap-3">
                <button
                  onClick={() => { setFormData(selectedTeacher); setShowForm(true); }}
                  className="flex-1 py-2.5 border-2 border-emcn-blue text-emcn-blue font-bold rounded-xl hover:bg-slate-50 transition-all"
                >
                  Editar Perfil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="bg-emcn-blue p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">{formData.id ? 'Editar Professor' : 'Novo Professor'}</h3>
              <button onClick={() => setShowForm(false)} className="hover:bg-white/10 p-1 rounded-lg"><X /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo</label>
                  <input
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-xl"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-xl"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Especialidades (separadas por vírgula)</label>
                  <input
                    placeholder="ex: Teologia, Homilética, Grego"
                    value={formData.specialties?.join(', ') || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value.split(',').map(s => s.trim()) }))}
                    className="w-full px-4 py-2 border rounded-xl"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Biografia Curta</label>
                  <textarea
                    rows={3}
                    value={formData.bio || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-xl"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-emcn-blue text-white font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-lg shadow-emcn-blue/20">Salvar Professor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersPage;
