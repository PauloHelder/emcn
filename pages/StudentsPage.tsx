import React, { useState } from 'react';
import { Student, Country, Province, Municipality, Commune } from '../types';
import { Plus, Search, Edit, Trash2, X, ChevronRight, Mail, Phone, Calendar, UserCheck, UserX, Globe, MapPin, Map } from 'lucide-react';
import { supabase } from '../supabase';

interface StudentsPageProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

const StudentsPage: React.FC<StudentsPageProps> = ({ students, setStudents }) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Student>>({ status: 'ACTIVE' });
  
  // Location state
  const [countries, setCountries] = useState<Country[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);

  React.useEffect(() => {
    fetchInitialLocations();
  }, []);

  // Fetch lists automatically when editing
  React.useEffect(() => {
    if (showForm && formData.countryId) {
      fetchProvinces(formData.countryId);
      if (formData.provinceId) {
        fetchMunicipalities(formData.provinceId);
        if (formData.municipalityId) {
          fetchCommunes(formData.municipalityId);
        }
      }
    }
  }, [showForm, formData.id]);

  // Fetch lists automatically for selected student detail card
  React.useEffect(() => {
    if (selectedStudent) {
      if (selectedStudent.countryId) fetchProvinces(selectedStudent.countryId);
      if (selectedStudent.provinceId) fetchMunicipalities(selectedStudent.provinceId);
      if (selectedStudent.municipalityId) fetchCommunes(selectedStudent.municipalityId);
    }
  }, [selectedStudent?.id]);

  const fetchInitialLocations = async () => {
    const { data } = await supabase.from('countries').select('*').order('name');
    if (data) setCountries(data);
  };

  const fetchProvinces = async (countryId: string) => {
    const { data } = await supabase.from('provinces').select('*').eq('country_id', countryId).order('name');
    if (data) setProvinces(data);
  };

  const fetchMunicipalities = async (provinceId: string) => {
    const { data } = await supabase.from('municipalities').select('*').eq('province_id', provinceId).order('name');
    if (data) {
      setMunicipalities(data.map(m => ({ id: m.id, provinceId: m.province_id, name: m.name })));
    }
  };

  const fetchCommunes = async (municipalityId: string) => {
    const { data } = await supabase.from('communes').select('*').eq('municipality_id', municipalityId).order('name');
    if (data) setCommunes(data);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        status: formData.status,
        country_id: formData.countryId || null,
        province_id: formData.provinceId || null,
        municipality_id: formData.municipalityId || null,
        commune_id: formData.communeId || null,
        address_details: formData.addressDetails || null
      };

      if (formData.id) {
        const { data, error } = await supabase
          .from('students')
          .update(payload)
          .eq('id', formData.id)
          .select()
          .single();

        if (error) throw error;
        const updated = {
            ...data,
            enrollmentDate: data.enrollment_date,
            countryId: data.country_id,
            provinceId: data.province_id,
            municipalityId: data.municipality_id,
            communeId: data.commune_id,
            addressDetails: data.address_details
        } as Student;
        setStudents(prev => prev.map(s => s.id === formData.id ? updated : s));
        if (selectedStudent?.id === formData.id) setSelectedStudent(updated);
      } else {
        const { data, error } = await supabase
          .from('students')
          .insert([{
            ...payload,
            role: 'STUDENT',
            enrollment_date: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;
        const newStudent = {
            ...data,
            enrollmentDate: data.enrollment_date,
            countryId: data.country_id,
            provinceId: data.province_id,
            municipalityId: data.municipality_id,
            communeId: data.commune_id,
            addressDetails: data.address_details
        } as Student;
        setStudents(prev => [...prev, newStudent]);
      }
      setShowForm(false);
    } catch (err: any) {
      alert('Erro ao salvar aluno: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este aluno?')) return;
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setStudents(prev => prev.filter(s => s.id !== id));
      if (selectedStudent?.id === id) setSelectedStudent(null);
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className={`${selectedStudent ? 'hidden lg:block' : 'lg:col-span-3'} space-y-6`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800">Alunos</h2>
          <button
            onClick={() => { setFormData({ status: 'ACTIVE' }); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-emcn-blue text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold shadow-md"
          >
            <Plus size={18} /> Novo Aluno
          </button>
        </div>

        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input type="text" placeholder="Filtrar por nome..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-1 focus:ring-emcn-gold outline-none" />
            </div>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4 hidden md:table-cell">Status</th>
                <th className="px-6 py-4 hidden sm:table-cell">Ingresso</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.length > 0 ? [...students].sort((a, b) => a.name.localeCompare(b.name)).map(student => (
                <tr key={student.id} className="hover:bg-slate-50 cursor-pointer group" onClick={() => setSelectedStudent(student)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                        {student.name.charAt(0)}
                      </div>
                      <div className="font-medium text-slate-800">{student.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${student.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {student.status === 'ACTIVE' ? <UserCheck size={12} /> : <UserX size={12} />}
                      {student.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell text-sm text-slate-500">
                    {new Date(student.enrollmentDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-3">
                      <button onClick={(e) => { e.stopPropagation(); setFormData(student); setShowForm(true); }} className="text-slate-400 hover:text-emcn-blue"><Edit size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(student.id); }} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                      <ChevronRight className="text-slate-300 group-hover:text-emcn-gold transition-colors" size={20} />
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-500">Nenhum aluno cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent && (
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-2xl shadow-xl overflow-hidden sticky top-24">
            <div className="h-24 bg-emcn-blue relative">
              <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 text-white hover:bg-white/10 p-1 rounded"><X size={20} /></button>
            </div>
            <div className="px-8 pb-8">
              <div className="relative flex justify-center">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg -mt-12 flex items-center justify-center font-serif text-3xl font-bold text-emcn-blue">
                  {selectedStudent.name.charAt(0)}
                </div>
              </div>
              <div className="text-center mt-4">
                <h2 className="text-2xl font-bold text-slate-800">{selectedStudent.name}</h2>
                <div className="mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedStudent.status === 'ACTIVE' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'
                    }`}>
                    Matrícula {selectedStudent.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0"><Mail size={20} /></div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase">E-mail</div>
                    <div className="text-sm font-medium">{selectedStudent.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0"><Phone size={20} /></div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase">Telefone</div>
                    <div className="text-sm font-medium">{selectedStudent.phone || '(Não informado)'}</div>
                  </div>
                </div>
                 {selectedStudent.countryId && (
                  <div className="flex items-center gap-4 text-slate-600">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0"><Globe size={20} /></div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase">Localização</div>
                      <div className="text-sm font-medium">
                        {countries.find(c => c.id === selectedStudent.countryId)?.name}
                        {selectedStudent.provinceId && ` · ${provinces.find(p => p.id === selectedStudent.provinceId)?.name}`}
                        {selectedStudent.municipalityId && ` · ${municipalities.find(m => m.id === selectedStudent.municipalityId)?.name}`}
                      </div>
                      {selectedStudent.communeId && (
                        <div className="text-xs text-slate-400">
                          {communes.find(c => c.id === selectedStudent.communeId)?.name}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {selectedStudent.addressDetails && (
                  <div className="flex items-center gap-4 text-slate-600">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0"><MapPin size={20} /></div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase">Endereço</div>
                      <div className="text-sm font-medium">{selectedStudent.addressDetails}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0"><Calendar size={20} /></div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase">Data de Cadastro</div>
                    <div className="text-sm font-medium">{new Date(selectedStudent.enrollmentDate).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-4">
                <button
                  onClick={() => { setFormData(selectedStudent); setShowForm(true); }}
                  className="py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => {
                    const newStatus = selectedStudent.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                    setStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, status: newStatus as any } : s));
                    setSelectedStudent({ ...selectedStudent, status: newStatus as any });
                  }}
                  className={`py-3 rounded-xl font-bold text-white transition-colors ${selectedStudent.status === 'ACTIVE' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                    }`}
                >
                  {selectedStudent.status === 'ACTIVE' ? 'Inativar' : 'Ativar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-emcn-blue p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">{formData.id ? 'Editar Aluno' : 'Novo Cadastro de Aluno'}</h3>
              <button onClick={() => setShowForm(false)} className="hover:bg-white/10 p-1 rounded-lg"><X /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo</label>
                <input required value={formData.name || ''} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail</label>
                <input type="email" required value={formData.email || ''} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Telefone</label>
                  <input value={formData.phone || ''} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="(00) 00000-0000" className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))} className="w-full px-4 py-2 border rounded-xl bg-white">
                    <option value="ACTIVE">Ativo</option>
                    <option value="INACTIVE">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 space-y-4 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço de Residência</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">País</label>
                    <select
                      value={formData.countryId || ''}
                      onChange={(e) => {
                        const id = e.target.value;
                        setFormData(prev => ({ ...prev, countryId: id, provinceId: '', municipalityId: '', communeId: '' }));
                        fetchProvinces(id);
                        setProvinces([]);
                        setMunicipalities([]);
                        setCommunes([]);
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border-0 rounded-xl text-sm appearance-none"
                    >
                      <option value="">Selecione...</option>
                      {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Província</label>
                    <select
                      disabled={!formData.countryId}
                      value={formData.provinceId || ''}
                      onChange={(e) => {
                        const id = e.target.value;
                        setFormData(prev => ({ ...prev, provinceId: id, municipalityId: '', communeId: '' }));
                        fetchMunicipalities(id);
                        setMunicipalities([]);
                        setCommunes([]);
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border-0 rounded-xl text-sm appearance-none disabled:opacity-40"
                    >
                      <option value="">Selecione...</option>
                      {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Município</label>
                    <select
                      disabled={!formData.provinceId}
                      value={formData.municipalityId || ''}
                      onChange={(e) => {
                        const id = e.target.value;
                        setFormData(prev => ({ ...prev, municipalityId: id, communeId: '' }));
                        fetchCommunes(id);
                        setCommunes([]);
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border-0 rounded-xl text-sm appearance-none disabled:opacity-40"
                    >
                      <option value="">Selecione...</option>
                      {municipalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Comuna</label>
                    <select
                      disabled={!formData.municipalityId}
                      value={formData.communeId || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, communeId: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border-0 rounded-xl text-sm appearance-none disabled:opacity-40"
                    >
                      <option value="">Selecione...</option>
                      {communes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Bairro / Rua</label>
                    <input
                      value={formData.addressDetails || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, addressDetails: e.target.value }))}
                      placeholder="Bairro, Rua..."
                      className="w-full px-3 py-2 bg-slate-50 border-0 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 text-slate-600 font-bold">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-emcn-blue text-white font-bold rounded-xl shadow-lg">Salvar Dados</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
