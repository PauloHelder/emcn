
import React, { useState } from 'react';
import { School, ClassGroup } from '../types';
import { Plus, School as SchoolIcon, MapPin, ChevronRight, X, Loader2, Trash2, Edit } from 'lucide-react';
import { supabase } from '../supabase';

interface SchoolsPageProps {
    schools: School[];
    setSchools: React.Dispatch<React.SetStateAction<School[]>>;
    classes: ClassGroup[];
    onSelectSchool: (school: School) => void;
}

const SchoolsPage: React.FC<SchoolsPageProps> = ({ schools, setSchools, classes, onSelectSchool }) => {
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<School>>({});

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (formData.id) {
                const { data, error } = await supabase
                    .from('schools')
                    .update({
                        name: formData.name,
                        city: formData.city,
                        address: formData.address
                    })
                    .eq('id', formData.id)
                    .select()
                    .single();

                if (error) throw error;
                setSchools(prev => prev.map(s => s.id === formData.id ? (data as School) : s));
            } else {
                const { data, error } = await supabase
                    .from('schools')
                    .insert([{
                        name: formData.name,
                        city: formData.city,
                        address: formData.address
                    }])
                    .select()
                    .single();

                if (error) throw error;
                setSchools(prev => [...prev, data as School]);
            }
            setShowForm(false);
            setFormData({});
        } catch (err: any) {
            alert('Erro ao salvar escola: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Tem certeza que deseja excluir esta escola? Todas as turmas vinculadas também serão excluídas.')) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('schools').delete().eq('id', id);
            if (error) throw error;
            setSchools(prev => prev.filter(s => s.id !== id));
        } catch (err: any) {
            alert('Erro ao excluir: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Escolas / Unidades</h2>
                    <p className="text-sm text-slate-500 mt-1">Gerencie as unidades da Escola de Ministros.</p>
                </div>
                <button
                    onClick={() => { setFormData({}); setShowForm(true); }}
                    className="px-4 py-2 bg-emcn-blue text-white rounded-lg flex items-center gap-2 font-semibold shadow-md hover:bg-slate-800 transition-colors"
                >
                    <Plus size={18} /> Nova Unidade
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schools.length > 0 ? schools.map(school => (
                    <div
                        key={school.id}
                        onClick={() => onSelectSchool(school)}
                        className="bg-white p-6 rounded-3xl border-2 border-slate-50 shadow-sm group hover:border-emcn-gold transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-10 -mt-10 group-hover:bg-emcn-gold/10 transition-colors" />

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="p-3 bg-emcn-blue text-white rounded-2xl shadow-lg shadow-emcn-blue/20">
                                <SchoolIcon size={24} />
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFormData(school); setShowForm(true); }}
                                    className="p-2 text-slate-400 hover:text-emcn-blue hover:bg-white rounded-xl transition-all"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={(e) => handleDelete(e, school.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-xl transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 mb-2 relative z-10">{school.name}</h3>

                        <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <MapPin size={14} className="text-emcn-gold" />
                                {school.city}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {classes.filter(c => c.schoolId === school.id).length} Turmas Ativas
                            </div>
                            <div className="flex items-center gap-1 text-emcn-blue font-bold text-sm group-hover:gap-2 transition-all">
                                Ver Turmas <ChevronRight size={16} />
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
                        <SchoolIcon size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">Nenhuma escola cadastrada.</p>
                        <p className="text-sm">Comece cadastrando sua primeira unidade de ensino.</p>
                    </div>
                )}
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                        <div className="bg-emcn-blue p-8 text-white flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
                            <h3 className="text-2xl font-bold relative z-10">{formData.id ? 'Editar Unidade' : 'Nova Unidade'}</h3>
                            <button onClick={() => setShowForm(false)} disabled={loading} className="hover:bg-white/10 p-2 rounded-xl transition-colors relative z-10"><X /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Nome da Escola / Sede</label>
                                <input
                                    required
                                    disabled={loading}
                                    placeholder="Ex: EMCN - Sede Principal"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-5 py-3 border-2 border-slate-50 rounded-2xl focus:border-emcn-gold outline-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Cidade</label>
                                    <input
                                        required
                                        disabled={loading}
                                        placeholder="Cidade - UF"
                                        value={formData.city || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                        className="w-full px-5 py-3 border-2 border-slate-50 rounded-2xl focus:border-emcn-gold outline-none transition-all"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Endereço Completo</label>
                                    <input
                                        disabled={loading}
                                        placeholder="Rua, Número, Bairro..."
                                        value={formData.address || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                        className="w-full px-5 py-3 border-2 border-slate-50 rounded-2xl focus:border-emcn-gold outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
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
                                    {formData.id ? 'Atualizar' : 'Criar Unidade'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchoolsPage;
