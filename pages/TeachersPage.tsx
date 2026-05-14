
import React, { useState } from 'react';
import { Teacher, Discipline } from '../types';
import { Plus, Search, Edit, Trash2, X, ChevronRight, Mail, Book, Loader2, Check } from 'lucide-react';
import { supabase } from '../supabase';

interface TeachersPageProps {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  disciplines: Discipline[];
}

const TeachersPage: React.FC<TeachersPageProps> = ({ teachers, setTeachers, disciplines }) => {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Teacher>>({ discipline_ids: [] });
  const [searchTerm, setSearchTerm] = useState('');

  const getDisciplineName = (id: string) => disciplines.find(d => d.id === id)?.name || 'Desconhecida';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const teacherToSave = {
        name: formData.name,
        email: formData.email,
        bio: formData.bio,
        discipline_ids: formData.discipline_ids || []
      };

      if (formData.id) {
        const { data, error } = await supabase
          .from('teachers')
          .update(teacherToSave)
          .eq('id', formData.id)
          .select()
          .single();

        if (error) throw error;
        setTeachers(prev => prev.map(t => t.id === formData.id ? { ...t, ...data } as Teacher : t));
        if (selectedTeacher?.id === formData.id) setSelectedTeacher({ ...selectedTeacher, ...data });
      } else {
        const { data, error } = await supabase
          .from('teachers')
          .insert([{ ...teacherToSave }])
          .select()
          .single();

        if (error) throw error;
        setTeachers(prev => [...prev, data as Teacher]);
      }
      setShowForm(false);
      setFormData({ discipline_ids: [] });
    } catch (err: any) {
      alert('Erro ao salvar professor: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este professor?')) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('teachers').delete().eq('id', id);
      if (error) throw error;
      setTeachers(prev => prev.filter(t => t.id !== id));
      if (selectedTeacher?.id === id) setSelectedTeacher(null);
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleDiscipline = (id: string) => {
    setFormData(prev => {
      const current = prev.discipline_ids || [];
      const isSelected = current.includes(id);
      return {
        ...prev,
        discipline_ids: isSelected ? current.filter(i => i !== id) : [...current, id]
      };
    });
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* List Column */}
      <div className={`${selectedTeacher ? 'hidden lg:block' : 'lg:col-span-3'} space-y-6`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800">Professores</h2>
          <button
            onClick={() => { setFormData({ discipline_ids: [] }); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-emcn-blue text-white rounded-lg hover:bg-slate-800 shadow-md transition-all font-semibold"
          >
            <Plus size={18} /> Novo Professor
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-slate-100 rounded-2xl bg-white shadow-sm focus:border-emcn-gold outline-none transition-all"
          />
        </div>

        <div className="bg-white border-2 border-slate-50 rounded-3xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b text-slate-500 text-sm font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-5">Professor</th>
                <th className="px-6 py-5 hidden md:table-cell">Disciplinas</th>
                <th className="px-6 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTeachers.length > 0 ? filteredTeachers.map(teacher => (
                <tr
                  key={teacher.id}
                  className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${selectedTeacher?.id === teacher.id ? 'bg-slate-50/80' : ''}`}
                  onClick={() => setSelectedTeacher(teacher)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-emcn-blue/5 text-emcn-blue flex items-center justify-center font-bold border-2 border-white shadow-sm">
                        {teacher.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{teacher.name}</div>
                        <div className="text-sm text-slate-500">{teacher.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                      {(teacher.discipline_ids || []).slice(0, 2).map(id => (
                        <span key={id} className="px-2 py-1 bg-emcn-gold/10 text-emcn-gold rounded-lg text-[10px] font-bold border border-emcn-gold/10">
                          {getDisciplineName(id)}
                        </span>
                      ))}
                      {(teacher.discipline_ids || []).length > 2 && (
                        <span className="text-[10px] font-medium text-slate-400">
                          +{(teacher.discipline_ids || []).length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setFormData(teacher); setShowForm(true); }}
                        className="p-2 text-slate-400 hover:text-emcn-blue hover:bg-white rounded-xl transition-all"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(teacher.id); }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                      <div className="p-2"><ChevronRight className="text-slate-300" size={20} /></div>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center text-slate-400">Nenhum professor encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Column */}
      {selectedTeacher && (
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border-2 border-slate-50 rounded-3xl shadow-xl p-8 sticky top-24 animate-in slide-in-from-right-4 duration-300">
            <button
              onClick={() => setSelectedTeacher(null)}
              className="lg:hidden mb-6 flex items-center gap-1.5 text-emcn-blue font-bold px-3 py-1.5 bg-slate-50 rounded-lg"
            >
              ← Voltar para lista
            </button>
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-24 h-24 rounded-full bg-emcn-blue text-white text-3xl flex items-center justify-center font-serif mb-4 border-4 border-slate-50 shadow-2xl relative">
                {selectedTeacher.name.charAt(0)}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emcn-gold rounded-full border-4 border-white flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">{selectedTeacher.name}</h2>
              <div className="text-emcn-gold font-bold uppercase tracking-widest text-[10px] bg-emcn-gold/5 px-3 py-1 rounded-full mt-2">Docente Autorizado</div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                <Mail className="text-emcn-gold shrink-0 mt-1" size={20} />
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Contato Direto</div>
                  <div className="text-slate-700 font-medium break-all">{selectedTeacher.email}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Book className="text-emcn-gold" size={20} />
                  <span className="text-sm font-bold text-slate-400 uppercase">Disciplinas que Leciona</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(selectedTeacher.discipline_ids || []).map(id => (
                    <span key={id} className="px-4 py-2 bg-white text-slate-700 rounded-xl text-xs font-bold border-2 border-slate-50 shadow-sm">
                      {getDisciplineName(id)}
                    </span>
                  ))}
                  {(selectedTeacher.discipline_ids || []).length === 0 && (
                    <span className="text-xs text-slate-400 italic">Nenhuma disciplina vinculada.</span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-sm font-bold text-slate-400 uppercase">Sobre o Docente</div>
                <div className="text-slate-600 text-sm leading-relaxed p-4 bg-slate-50 rounded-2xl border-l-4 border-emcn-gold">
                  {selectedTeacher.bio || 'Biografia não cadastrada.'}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => { setFormData(selectedTeacher); setShowForm(true); }}
                  className="flex-1 py-3 bg-emcn-blue text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg"
                >
                  Editar Dados
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-emcn-blue p-8 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
              <h3 className="text-2xl font-bold relative z-10">{formData.id ? 'Atualizar Perfil' : 'Novo Docente'}</h3>
              <button onClick={() => setShowForm(false)} disabled={loading} className="hover:bg-white/10 p-2 rounded-xl transition-colors relative z-10"><X /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-8 overflow-y-auto max-h-[75vh]">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-emcn-gold uppercase">Informações Básicas</h4>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Nome Completo</label>
                    <input
                      required
                      placeholder="Nome do professor"
                      disabled={loading}
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-slate-50 rounded-2xl focus:border-emcn-gold outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">E-mail Institucional</label>
                    <input
                      type="email"
                      required
                      placeholder="email@exemplo.com"
                      disabled={loading}
                      value={formData.email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-slate-50 rounded-2xl focus:border-emcn-gold outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Breve Biografia</label>
                    <textarea
                      rows={4}
                      placeholder="Apresentação do professor..."
                      disabled={loading}
                      value={formData.bio || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-slate-50 rounded-2xl focus:border-emcn-gold outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-emcn-gold uppercase">Disciplinas Habilitadas</h4>
                  <div className="bg-slate-50 rounded-[24px] p-6 border-2 border-slate-100/50 space-y-4">
                    <div className="text-xs text-slate-500 mb-2 font-medium">Selecione as disciplinas que este professor leciona:</div>
                    <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {disciplines.length > 0 ? disciplines.map(discipline => (
                        <button
                          key={discipline.id}
                          type="button"
                          onClick={() => toggleDiscipline(discipline.id)}
                          disabled={loading}
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all font-bold text-sm ${formData.discipline_ids?.includes(discipline.id)
                            ? 'bg-emcn-blue border-emcn-blue text-white shadow-lg shadow-emcn-blue/20'
                            : 'bg-white border-white text-slate-600 hover:border-slate-100'
                            }`}
                        >
                          {discipline.name}
                          {formData.discipline_ids?.includes(discipline.id) ? <Check size={16} /> : <Plus size={16} className="text-slate-300" />}
                        </button>
                      )) : (
                        <div className="text-center py-10">
                          <Book className="mx-auto mb-2 text-slate-200" size={32} />
                          <div className="text-xs text-slate-400">Nenhuma disciplina cadastrada no sistema.</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 bg-emcn-gold text-white font-bold rounded-2xl shadow-xl hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={20} className="animate-spin" />}
                  Finalizar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersPage;
