
import React from 'react';
import { Link } from 'react-router-dom';
import { EnrollmentSettings } from '../types';
import { ArrowRight, CheckCircle, GraduationCap, Users, Calendar } from 'lucide-react';

const LandingPage: React.FC<{ enrollmentSettings: EnrollmentSettings }> = ({ enrollmentSettings }) => {
  return (
    <div className="bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-10 h-10" />
          <span className="font-serif text-xl font-bold text-emcn-blue hidden sm:block">EMCN</span>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-4 py-2 text-emcn-blue font-medium hover:text-emcn-gold transition-colors">Login</Link>
          {enrollmentSettings.isOpen && (
            <Link to="/inscricao" className="px-4 py-2 bg-emcn-gold text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors">Inscreva-se</Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="z-10">
            <h1 className="text-5xl lg:text-7xl font-serif text-emcn-blue mb-6 leading-tight">
              Capacitando <span className="text-emcn-gold">Ministros</span> para a Obra
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-lg">
              A Escola de Ministros da Comunidade Nacional oferece uma formação teológica e prática sólida para quem deseja servir no Reino de Deus.
            </p>
            <div className="flex flex-wrap gap-4">
              {enrollmentSettings.isOpen ? (
                <Link to="/inscricao" className="px-8 py-4 bg-emcn-gold text-white rounded-xl font-bold text-lg flex items-center gap-2 hover:shadow-lg hover:shadow-emcn-gold/20 transition-all">
                  Quero me Inscrever <ArrowRight size={20} />
                </Link>
              ) : (
                <div className="px-8 py-4 bg-slate-100 text-slate-500 rounded-xl font-bold text-lg border">
                  Inscrições Encerradas no momento
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-emcn-gold/10 rounded-full blur-3xl" />
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop"
              alt="Estudantes"
              className="rounded-3xl shadow-2xl relative z-10 w-full object-cover aspect-video lg:aspect-square"
            />
          </div>
        </div>
      </section>

      {/* Stats/Features */}
      <section className="bg-emcn-blue py-20 text-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emcn-gold/20 rounded-full flex items-center justify-center mb-6">
                <GraduationCap className="text-emcn-gold" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Corpo Docente</h3>
              <p className="text-slate-300">Professores experientes e atuantes no ministério prático.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emcn-gold/20 rounded-full flex items-center justify-center mb-6">
                <Calendar className="text-emcn-gold" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Grade Anual</h3>
              <p className="text-slate-300">Planejamento organizado com disciplinas fundamentais.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emcn-gold/20 rounded-full flex items-center justify-center mb-6">
                <Users className="text-emcn-gold" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Comunidade</h3>
              <p className="text-slate-300">Networking e crescimento espiritual mútuo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <h2 className="text-4xl font-serif text-emcn-blue mb-8">Pronto para dar o próximo passo?</h2>
          <p className="text-lg text-slate-600 mb-10">
            Junte-se a centenas de alunos que já foram impactados pela Escola de Ministros.
            Nossas turmas são anuais e as vagas são limitadas.
          </p>
          {enrollmentSettings.isOpen && (
            <div className="p-6 bg-white border border-emcn-gold/30 rounded-2xl inline-block">
              <div className="text-emcn-gold font-bold mb-2">Prazo de Inscrição: {new Date(enrollmentSettings.deadline).toLocaleDateString()}</div>
              <Link to="/inscricao" className="px-8 py-3 bg-emcn-blue text-white rounded-lg font-bold hover:bg-slate-800 transition-all inline-block">
                Inscrever Agora
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-white">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-12 h-12" />
            <div className="text-emcn-blue font-serif font-bold text-lg">EMCN</div>
          </div>
          <div className="text-slate-500 text-sm">
            © 2024 Escola de Ministros Comunidade Nacional. Todos os direitos reservados.
          </div>
          <div className="flex gap-4">
            <a href="#" className="text-slate-400 hover:text-emcn-gold">Instagram</a>
            <a href="#" className="text-slate-400 hover:text-emcn-gold">Facebook</a>
            <a href="#" className="text-slate-400 hover:text-emcn-gold">YouTube</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
