import React, { useState } from 'react';
import { EnrollmentSettings, Student } from '../types';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Calendar, GraduationCap, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabase';

interface EnrollmentPageProps {
  settings: EnrollmentSettings;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

const EnrollmentPage: React.FC<EnrollmentPageProps> = ({ settings, students, setStudents }) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const newStudent = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: 'STUDENT' as const,
        status: 'INACTIVE' as const, // Awaiting approval
        enrollment_date: new Date().toISOString(),
      };

      const { data, error: insertError } = await supabase
        .from('students')
        .insert([newStudent])
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        setStudents(prev => [...prev, data as Student]);
        setSubmitted(true);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao enviar sua inscrição. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const isExpired = new Date(settings.deadline) < new Date();

  if (!settings.isOpen || isExpired) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white p-12 rounded-3xl shadow-xl border">
          <AlertCircle className="mx-auto text-red-500 mb-6" size={64} />
          <h1 className="text-3xl font-serif text-emcn-blue mb-4">Inscrições Encerradas</h1>
          <p className="text-slate-600 mb-8">Neste momento não estamos aceitando novas matrículas. Fique atento às nossas redes sociais para o próximo período.</p>
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
            <img src="https://emcn.com.br/wp-content/uploads/2021/04/cropped-LOGOTIPO-EMCN-1-192x192.png" className="w-10 h-10" />
            <span className="font-serif font-bold text-emcn-blue">EMCN</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-emcn-blue text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emcn-gold opacity-10 rounded-full" />
              <h1 className="text-4xl font-serif mb-6 leading-tight">Formulário de Inscrição</h1>
              <p className="text-slate-300 mb-8">{settings.message}</p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-emcn-gold"><Calendar size={18} /></div>
                  <div>
                    <div className="text-xs opacity-60">Prazo final</div>
                    <div className="font-bold">{new Date(settings.deadline).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-emcn-gold"><GraduationCap size={18} /></div>
                  <div>
                    <div className="text-xs opacity-60">Status</div>
                    <div className="font-bold">Aguardando Avaliação</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4">Próximos Passos:</h3>
              <ul className="space-y-3">
                <li className="flex gap-3 text-sm text-slate-600">
                  <CheckCircle className="text-green-500 shrink-0" size={18} /> Preencha o formulário ao lado.
                </li>
                <li className="flex gap-3 text-sm text-slate-600">
                  <CheckCircle className="text-slate-300 shrink-0" size={18} /> Aguarde o contato da secretaria.
                </li>
                <li className="flex gap-3 text-sm text-slate-600">
                  <CheckCircle className="text-slate-300 shrink-0" size={18} /> Realize o pagamento da taxa.
                </li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-3">
            {submitted ? (
              <div className="bg-white p-12 rounded-3xl shadow-xl border text-center animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} />
                </div>
                <h2 className="text-3xl font-serif text-slate-800 mb-4">Solicitação Enviada!</h2>
                <p className="text-slate-600 mb-8">Obrigado por se inscrever, <strong>{formData.name}</strong>. Nossa equipe entrará em contato em breve através do e-mail <strong>{formData.email}</strong>.</p>
                <Link to="/" className="inline-block px-8 py-3 bg-emcn-blue text-white rounded-xl font-bold shadow-lg shadow-emcn-blue/20">Voltar ao site</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white p-10 rounded-3xl shadow-xl border space-y-6">
                {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nome Completo</label>
                  <input
                    required
                    disabled={loading}
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl focus:border-emcn-gold outline-none transition-all disabled:opacity-50"
                    placeholder="Como deseja ser chamado?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Seu Melhor E-mail</label>
                  <input
                    type="email"
                    required
                    disabled={loading}
                    value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl focus:border-emcn-gold outline-none transition-all disabled:opacity-50"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Telefone / WhatsApp</label>
                  <input
                    required
                    disabled={loading}
                    value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl focus:border-emcn-gold outline-none transition-all disabled:opacity-50"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="pt-4">
                  <button
                    disabled={loading}
                    className="w-full bg-emcn-blue text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-emcn-blue/20 hover:bg-slate-800 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none"
                  >
                    {loading ? 'Enviando...' : 'Enviar Minha Inscrição'}
                  </button>
                  <p className="text-center text-xs text-slate-400 mt-4">Ao clicar, você concorda com nossos termos de privacidade.</p>
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
