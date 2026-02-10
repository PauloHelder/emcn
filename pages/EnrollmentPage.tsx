
import React, { useState, useEffect } from 'react';
import { EnrollmentSettings, Student, ClassGroup, School } from '../types';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, AlertCircle, Calendar, GraduationCap, ArrowLeft } from 'lucide-react';
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
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const location = useLocation();

  const openClasses = classes.filter(c => {
    if (!c.isEnrollmentOpen) return false;
    if (c.enrollmentDeadline && new Date(c.enrollmentDeadline) < new Date()) return false;
    return true;
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const classIdFromUrl = params.get('classId');
    if (classIdFromUrl) {
      setSelectedClassId(classIdFromUrl);
    } else if (openClasses.length === 1 && !selectedClassId) {
      setSelectedClassId(openClasses[0].id);
    }
  }, [location, openClasses, selectedClassId]);

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
      const newStudent = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
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

      if (data) {
        if (selectedClassId) {
          const currentStudents = selectedClass.students || [];
          await supabase.from('classes').update({
            students: [...currentStudents, data.id]
          }).eq('id', selectedClassId);
        }

        setStudents(prev => [...prev, { ...data, enrollmentDate: data.enrollment_date } as Student]);
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
          <h1 className="text-3xl font-serif text-emcn-blue mb-4">Inscrições Encerradas</h1>
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
