
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { EnrollmentSettings, ClassGroup, School } from '../types';
import { ArrowRight, GraduationCap, Users, Calendar, X } from 'lucide-react';

interface LandingPageProps {
  enrollmentSettings: EnrollmentSettings;
  classes: ClassGroup[];
  schools: School[];
}

const LandingPage: React.FC<LandingPageProps> = ({ classes, schools }) => {
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for schoolId in URL to open modal automatically (redirected from UnitsPage)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const schoolId = params.get('schoolId');
    if (schoolId) {
      const school = schools.find(s => s.id === schoolId);
      if (school) setSelectedSchool(school);
    }
  }, [location, schools]);

  const getOpenClassesForSchool = (schoolId: string) => {
    return classes.filter(c =>
      c.schoolId === schoolId &&
      c.isEnrollmentOpen &&
      (!c.enrollmentDeadline || new Date(c.enrollmentDeadline) >= new Date())
    );
  };

  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "https://via.placeholder.com/150?text=EMCN+LOGO";
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2 font-serif text-xl font-bold text-emcn-blue">
          <img
            src="https://emcn.com.br/wp-content/uploads/2021/04/cropped-LOGOTIPO-EMCN-1-192x192.png"
            alt="Logo"
            className="w-10 h-10 object-contain"
            onError={handleLogoError}
          />
          <span className="hidden sm:block">EMCN</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/unidades" className="text-slate-600 font-medium hover:text-emcn-blue transition-colors hidden md:block">Unidades</Link>
          <Link to="/login" className="px-4 py-2 text-emcn-blue font-medium hover:text-emcn-gold transition-colors border border-emcn-blue/20 rounded-lg">Acesso Restrito</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="z-10">
            <div className="inline-block px-4 py-1.5 bg-emcn-gold/10 text-emcn-gold rounded-full text-sm font-bold mb-6">
              Inscrições Abertas para {new Date().getFullYear()}
            </div>
            <h1 className="text-5xl lg:text-7xl font-serif text-emcn-blue mb-6 leading-tight">
              Capacitando <br />
              <span className="text-emcn-gold italic">Líderes Reais</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-lg leading-relaxed">
              Formação profunda para quem deseja servir no Reino de Deus com excelência e profundidade teológica.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/unidades" className="px-8 py-4 bg-emcn-blue text-white rounded-xl font-bold text-lg flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-emcn-blue/20">
                Ver Unidades e Turmas <ArrowRight size={20} />
              </Link>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-emcn-gold/10 rounded-full blur-3xl group-hover:bg-emcn-gold/20 transition-all" />
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop"
              alt="Estudantes EMCN"
              className="rounded-[40px] shadow-2xl relative z-10 w-full object-cover aspect-video lg:aspect-square"
              onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1544535830-9dff9a014bb0?q=80&w=1200"; }}
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-emcn-blue py-24 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-serif mb-16 underline decoration-emcn-gold decoration-4 underline-offset-8 text-center mx-auto">Nossos Pilares</h2>
          <div className="grid md:grid-cols-3 gap-16">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-8 rotate-3 hover:rotate-0 transition-transform">
                <GraduationCap className="text-emcn-gold" size={36} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Docência Qualificada</h3>
              <p className="text-slate-400 leading-relaxed font-medium">Líderes e mestres com experiência prática no ministério.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-8 -rotate-3 hover:rotate-0 transition-transform">
                <Calendar className="text-emcn-gold" size={36} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Ensino Presencial</h3>
              <p className="text-slate-400 leading-relaxed font-medium">Unidades físicas em diversas sedes para maior proximidade.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-8 rotate-3 hover:rotate-0 transition-transform">
                <Users className="text-emcn-gold" size={36} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Comunhão</h3>
              <p className="text-slate-400 leading-relaxed font-medium">Mais que uma aula, uma rede de relacionamentos ministeriais.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-6xl font-serif text-emcn-blue mb-8">Inicie sua Jornada</h2>
          <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto">Não deixe seu chamado para depois. Inscreva-se em uma de nossas unidades agora.</p>
          <Link to="/unidades" className="inline-block px-12 py-5 bg-emcn-gold text-white rounded-2xl font-bold text-xl shadow-2xl shadow-emcn-gold/30 hover:scale-105 transition-transform">
            Escolher Minha Unidade
          </Link>
        </div>
      </section>

      {/* Modal for Classes (when redirected with schoolId) */}
      {selectedSchool && (
        <div className="fixed inset-0 bg-emcn-blue/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-emcn-blue p-8 text-white flex justify-between items-center relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
              <div className="relative z-10">
                <div className="text-xs font-bold text-emcn-gold uppercase tracking-widest mb-1">Turmas Disponíveis</div>
                <h3 className="text-2xl font-bold">{selectedSchool.name}</h3>
              </div>
              <button
                onClick={() => {
                  setSelectedSchool(null);
                  navigate('/'); // Clear query params
                }}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all relative z-10"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {getOpenClassesForSchool(selectedSchool.id).map(c => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/inscricao?classId=${c.id}`)}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-50 rounded-3xl border-2 border-transparent hover:border-emcn-gold hover:bg-white transition-all cursor-pointer"
                >
                  <div>
                    <div className="text-xl font-bold text-slate-800 mb-1">{c.name}</div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5"><Calendar size={14} className="text-emcn-gold" /> Ano {c.year}</div>
                    </div>
                  </div>
                  <button className="px-6 py-3 bg-emcn-blue text-white rounded-2xl font-bold text-sm group-hover:bg-emcn-gold transition-all">
                    Fazer Inscrição
                  </button>
                </div>
              ))}
              {getOpenClassesForSchool(selectedSchool.id).length === 0 && (
                <div className="text-center py-10 text-slate-400 font-medium">
                  Nenhuma turma aberta para inscrição nesta unidade no momento.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-16 border-t bg-white">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="flex items-center gap-4">
            <img src="https://emcn.com.br/wp-content/uploads/2021/04/cropped-LOGOTIPO-EMCN-1-192x192.png" alt="Logo" className="w-12 h-12 object-contain" onError={handleLogoError} />
            <div className="text-emcn-blue font-serif font-bold text-2xl tracking-tight">EMCN</div>
          </div>
          <div className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
            Escola de Ministros Comunidade Nacional
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
