import React, { useState } from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';
import { supabase } from '../supabase';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : authError.message);
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-emcn-blue p-8 text-center text-white">
          <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center p-2">
            <img src="https://emcn.com.br/wp-content/uploads/2021/04/cropped-LOGOTIPO-EMCN-1-192x192.png" alt="Logo" />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-widest text-emcn-gold">EMCN</h1>
          <p className="text-slate-300 mt-2">Área Administrativa e Acadêmica</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emcn-blue focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emcn-blue focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-emcn-blue text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all shadow-lg shadow-emcn-blue/20 disabled:opacity-50"
            >
              <LogIn size={20} /> {loading ? 'Carregando...' : 'Entrar no Sistema'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t text-center text-slate-500 text-sm">
            Esqueceu sua senha? <a href="#" className="text-emcn-blue font-semibold hover:underline">Recuperar</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
