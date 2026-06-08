import React, { useState, useEffect } from 'react';
import { EnrollmentSettings, Student, ClassGroup, School, Country, Province, Municipality, Commune } from '../types';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, AlertCircle, Calendar, GraduationCap, ArrowLeft, Globe, MapPin, Map } from 'lucide-react';
import { supabase } from '../supabase';

interface EnrollmentPageProps {
  settings: EnrollmentSettings;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  classes: ClassGroup[];
  schools: School[];
}

const EnrollmentPage: React.FC<EnrollmentPageProps> = ({ settings, setStudents, classes, schools }) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [checkedRequirements, setCheckedRequirements] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryId: '',
    provinceId: '',
    municipalityId: '',
    communeId: '',
    address: ''
  });

  // Location state
  const [countries, setCountries] = useState<Country[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);

  const location = useLocation();

  const openClasses = classes.filter(c => {
    if (!c.isEnrollmentOpen) return false;
    if (c.enrollmentDeadline && new Date(c.enrollmentDeadline) < new Date()) return false;
    return true;
  });

  useEffect(() => {
    fetchInitialLocations();
    const params = new URLSearchParams(location.search);
    const classIdFromUrl = params.get('classId');
    if (classIdFromUrl) {
      setSelectedClassId(classIdFromUrl);
    } else if (openClasses.length === 1 && !selectedClassId) {
      setSelectedClassId(openClasses[0].id);
    }
  }, [location, openClasses, selectedClassId]);

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

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const toggleRequirement = (req: string) => {
    setCheckedRequirements(prev => ({
      ...prev,
      [req]: !prev[req]
    }));
  };

  const allRequirementsMet = selectedClass
    ? (selectedClass.enrollmentRequirements || []).every(req => checkedRequirements[req])
    : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) {
      setError('Por favor, selecione uma turma.');
      return;
    }
    if (!allRequirementsMet) {
      setError('Você precisa confirmar que atende a todos os requisitos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Verificar se já existe um aluno com este e-mail
      const { data: existingStudents, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .eq('email', formData.email);

      if (fetchError) throw fetchError;

      let studentData: any = existingStudents && existingStudents.length > 0 ? existingStudents[0] : null;

      if (studentData) {
        // 2. Verificar se já está inscrito NESTA turma específica
        if (selectedClass?.students?.includes(studentData.id)) {
          setError('Você já está inscrito nesta turma com este e-mail.');
          setLoading(false);
          return;
        }

        // Opcional: Atualizar dados de contato caso tenham mudado
        await supabase
          .from('students')
          .update({ name: formData.name, phone: formData.phone })
          .eq('id', studentData.id);
      } else {
        // 3. Novo aluno
        const newStudent = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          country_id: formData.countryId || null,
          province_id: formData.provinceId || null,
          municipality_id: formData.municipalityId || null,
          commune_id: formData.communeId || null,
          address_details: formData.address || null,
          role: 'STUDENT' as const,
          status: 'INACTIVE' as const,
          enrollment_date: new Date().toISOString(),
        };

        const { data, error: insertError } = await supabase
          .from('students')
          .insert([newStudent])
          .select()
          .single();

        if (insertError) throw insertError;
        studentData = data;
      }

      // 4. Vincular o aluno (existente ou novo) à turma
      if (studentData && selectedClassId) {
        const currentStudents = selectedClass?.students || [];
        const { error: updateError } = await supabase
          .from('classes')
          .update({
            students: [...currentStudents, studentData.id]
          })
          .eq('id', selectedClassId);

        if (updateError) throw updateError;

        // Atualizar estado local (opcional/consistência)
        setStudents(prev => {
          const exists = prev.find(s => s.id === studentData.id);
          if (exists) {
            return prev.map(s => s.id === studentData.id ? { ...s, name: formData.name, phone: formData.phone } : s);
          }
          return [...prev, { ...studentData, enrollmentDate: studentData.enrollment_date } as Student];
        });

        setSubmitted(true);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao enviar sua inscrição. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (openClasses.length === 0 && !selectedClassId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white p-12 rounded-3xl shadow-xl border">
          <AlertCircle className="mx-auto text-red-500 mb-6" size={64} />
          <h2 className="text-3xl font-serif text-emcn-blue mb-4">Inscrições Encerradas</h2>
          <p className="text-slate-600 mb-8">Não há turmas abertas. Fique atento às nossas redes!</p>
          <Link to="/" className="text-emcn-blue font-bold flex items-center justify-center gap-2 hover:underline">
            <ArrowLeft size={18} /> Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-emcn-blue font-semibold hover:underline">
            <ArrowLeft size={20} /> Início
          </Link>
          <div className="flex items-center gap-2">
            <img src="https://emcn.com.br/wp-content/uploads/2021/04/cropped-LOGOTIPO-EMCN-1-192x192.png" alt="Logo" className="w-10 h-10" />
            <span className="font-serif font-bold text-emcn-blue text-xl">EMCN</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-emcn-blue text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emcn-gold opacity-10 rounded-full" />
              <h1 className="text-4xl font-serif mb-6 leading-tight">Inscrição Online</h1>
              <p className="text-slate-300 mb-8">
                {selectedClass?.enrollmentMessage || settings.message}
              </p>

              {selectedClass && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-emcn-gold"><Calendar size={18} /></div>
                    <div>
                      <div className="text-xs opacity-60">Prazo final</div>
                      <div className="font-bold">{selectedClass.enrollmentDeadline ? new Date(selectedClass.enrollmentDeadline).toLocaleDateString() : 'Não definido'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-emcn-gold"><GraduationCap size={18} /></div>
                    <div>
                      <div className="text-xs opacity-60">Unidade</div>
                      <div className="font-bold text-green-400">
                        {schools.find(s => s.id === selectedClass.schoolId)?.name || 'Sede Principal'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedClass && selectedClass.enrollmentRequirements && selectedClass.enrollmentRequirements.length > 0 && (
              <div className="bg-white p-8 rounded-3xl border-2 border-emcn-gold/20 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <AlertCircle size={20} className="text-emcn-gold" /> Requisitos
                </h3>
                <div className="space-y-4">
                  {selectedClass.enrollmentRequirements.map((req, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleRequirement(req)}
                      className={`w-full flex items-start gap-3 p-4 rounded-2xl border-2 transition-all text-left ${checkedRequirements[req]
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-100 bg-slate-50 hover:border-emcn-gold/30'
                        }`}
                    >
                      <div className={`mt-1 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${checkedRequirements[req] ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'
                        }`}>
                        {checkedRequirements[req] && <CheckCircle size={14} />}
                      </div>
                      <span className={`text-sm font-medium ${checkedRequirements[req] ? 'text-green-800' : 'text-slate-600'}`}>
                        {req}
                      </span>
                    </button>
                  ))}
                </div>
                {!allRequirementsMet && (
                  <p className="mt-6 text-xs text-red-500 font-bold flex items-center gap-1.5 animate-pulse">
                    <AlertCircle size={14} /> Confirme os requisitos para prosseguir.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            {submitted ? (
              <div className="bg-white p-12 rounded-3xl shadow-xl border text-center animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} />
                </div>
                <h2 className="text-3xl font-serif text-slate-800 mb-4">Solicitação Enviada!</h2>
                <p className="text-slate-600 mb-8">Obrigado por se inscrever na turma <strong>{selectedClass?.name}</strong>. Entraremos em contato em breve.</p>
                <Link to="/" className="inline-block px-8 py-3 bg-emcn-blue text-white rounded-xl font-bold shadow-lg">Voltar ao site</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white p-10 rounded-3xl shadow-xl border space-y-6">
                {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}

                <div className="p-6 bg-slate-50 rounded-[32px] border-2 border-slate-100">
                  <div className="text-[10px] font-bold text-emcn-gold uppercase tracking-widest mb-1">Inscrição para</div>
                  <div className="text-2xl font-bold text-emcn-blue">{selectedClass?.name || 'Aguardando seleção...'}</div>
                  <div className="text-sm text-slate-500 font-medium italic">
                    {schools.find(s => s.id === selectedClass?.schoolId)?.name || 'Unidade selecionada via site'}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nome Completo</label>
                    <input
                      required
                      disabled={loading}
                      value={formData.name}
                      onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl focus:border-emcn-gold outline-none transition-all"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">E-mail</label>
                    <input
                      type="email"
                      required
                      disabled={loading}
                      value={formData.email}
                      onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                      className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl focus:border-emcn-gold outline-none transition-all"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Telefone</label>
                    <input
                      required
                      disabled={loading}
                      value={formData.phone}
                      onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                      className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl focus:border-emcn-gold outline-none transition-all"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="pt-6 space-y-6 border-t border-slate-100">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Endereço de Residência</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">País</label>
                      <select
                        required
                        disabled={loading}
                        value={formData.countryId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setFormData(p => ({ ...p, countryId: id, provinceId: '', municipalityId: '', communeId: '' }));
                          fetchProvinces(id);
                          setProvinces([]);
                          setMunicipalities([]);
                          setCommunes([]);
                        }}
                        className="w-full px-5 py-3 bg-slate-50 border-2 border-transparent focus:border-emcn-gold rounded-2xl outline-none appearance-none"
                      >
                        <option value="">Selecione o País</option>
                        {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Província</label>
                      <select
                        required
                        disabled={loading || !formData.countryId}
                        value={formData.provinceId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setFormData(p => ({ ...p, provinceId: id, municipalityId: '', communeId: '' }));
                          fetchMunicipalities(id);
                          setMunicipalities([]);
                          setCommunes([]);
                        }}
                        className="w-full px-5 py-3 bg-slate-50 border-2 border-transparent focus:border-emcn-gold rounded-2xl outline-none appearance-none disabled:opacity-50"
                      >
                        <option value="">Selecione a Província</option>
                        {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Município</label>
                      <select
                        required
                        disabled={loading || !formData.provinceId}
                        value={formData.municipalityId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setFormData(p => ({ ...p, municipalityId: id, communeId: '' }));
                          fetchCommunes(id);
                          setCommunes([]);
                        }}
                        className="w-full px-5 py-3 bg-slate-50 border-2 border-transparent focus:border-emcn-gold rounded-2xl outline-none appearance-none disabled:opacity-50"
                      >
                        <option value="">Selecione o Município</option>
                        {municipalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Comuna</label>
                      <select
                        required
                        disabled={loading || !formData.municipalityId}
                        value={formData.communeId}
                        onChange={(e) => setFormData(p => ({ ...p, communeId: e.target.value }))}
                        className="w-full px-5 py-3 bg-slate-50 border-2 border-transparent focus:border-emcn-gold rounded-2xl outline-none appearance-none disabled:opacity-50"
                      >
                        <option value="">Selecione a Comuna</option>
                        {communes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Endereço Detalhado / Bairro</label>
                      <input
                        required
                        disabled={loading}
                        value={formData.address}
                        onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                        className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl focus:border-emcn-gold outline-none transition-all"
                        placeholder="Rua, Bairro, Casa nº..."
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    disabled={loading || !allRequirementsMet}
                    className="w-full bg-emcn-blue text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-slate-800 transition-all disabled:opacity-30 disabled:grayscale"
                  >
                    {loading ? 'Enviando...' : 'Confirmar Minha Inscrição'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentPage;
