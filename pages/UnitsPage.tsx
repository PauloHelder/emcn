
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClassGroup, School } from '../types';
import { MapPin, School as SchoolIcon, ChevronRight, ArrowLeft } from 'lucide-react';

interface UnitsPageProps {
    classes: ClassGroup[];
    schools: School[];
}

const UnitsPage: React.FC<UnitsPageProps> = ({ classes, schools }) => {
    const navigate = useNavigate();

    const getOpenClassesForSchool = (schoolId: string) => {
        return classes.filter(c =>
            c.schoolId === schoolId &&
            c.isEnrollmentOpen &&
            (!c.enrollmentDeadline || new Date(c.enrollmentDeadline) >= new Date())
        );
    };

    return (
        <div className="bg-white min-h-screen">
            {/* Navbar Minimalist */}
            <nav className="flex items-center justify-between px-6 py-6 bg-white border-b">
                <Link to="/" className="flex items-center gap-2 font-serif text-xl font-bold text-emcn-blue">
                    <ArrowLeft size={20} />
                    <span>Voltar para Início</span>
                </Link>
                <div className="flex items-center gap-3">
                    <img src="https://emcn.com.br/wp-content/uploads/2021/04/cropped-LOGOTIPO-EMCN-1-192x192.png" alt="Logo EMCN" className="w-10 h-10 object-contain" onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/150?text=EMCN" }} />
                    <span className="font-serif font-bold text-emcn-blue text-lg">EMCN</span>
                </div>
            </nav>

            <div className="container mx-auto px-6 py-16">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h1 className="text-5xl font-serif text-emcn-blue mb-4 tracking-tight">Escolha sua <span className="text-emcn-gold">Unidade</span></h1>
                    <p className="text-slate-500 text-lg">Selecione abaixo a sede da Escola de Ministros onde você deseja realizar sua formação.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {schools.length > 0 ? (
                        schools.map(school => {
                            const openClasses = getOpenClassesForSchool(school.id);
                            return (
                                <div
                                    key={school.id}
                                    onClick={() => openClasses.length > 0 && navigate(`/?schoolId=${school.id}`)}
                                    className={`bg-white p-10 rounded-[40px] border-2 transition-all cursor-pointer relative overflow-hidden group shadow-sm hover:shadow-2xl hover:shadow-emcn-blue/5 ${openClasses.length > 0
                                            ? 'border-slate-50 hover:border-emcn-gold'
                                            : 'border-slate-100 opacity-60 grayscale cursor-not-allowed'
                                        }`}
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-emcn-gold/10 transition-colors" />

                                    <div className="flex justify-between items-start mb-8 relative z-10">
                                        <div className="p-5 bg-emcn-blue text-white rounded-[24px] shadow-lg shadow-emcn-blue/20">
                                            <SchoolIcon size={28} />
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${openClasses.length > 0
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {openClasses.length > 0 ? `${openClasses.length} Turmas Abertas` : 'Inscrições Feitadas'}
                                        </span>
                                    </div>

                                    <h3 className="text-3xl font-bold text-slate-800 mb-2 relative z-10">{school.name}</h3>
                                    <div className="flex items-center gap-2 text-slate-500 mb-8 relative z-10">
                                        <MapPin size={18} className="text-emcn-gold" />
                                        <span className="text-base font-semibold">{school.city}</span>
                                    </div>

                                    {openClasses.length > 0 && (
                                        <div className="flex items-center gap-2 text-emcn-blue font-bold text-sm relative z-10 group-hover:gap-3 transition-all">
                                            Ver Turmas e Inscrições <ChevronRight size={20} />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-24 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                            <SchoolIcon size={64} className="mx-auto mb-6 text-slate-200" />
                            <p className="text-slate-400 text-xl font-medium">Nenhuma unidade disponível no momento.</p>
                        </div>
                    )}
                </div>
            </div>

            <footer className="py-20 border-t mt-20 bg-slate-50">
                <div className="container mx-auto px-6 text-center">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <img src="https://emcn.com.br/wp-content/uploads/2021/04/cropped-LOGOTIPO-EMCN-1-192x192.png" alt="Logo" className="w-12 h-12" onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/150?text=EMCN" }} />
                        <div className="text-emcn-blue font-serif font-bold text-2xl">EMCN</div>
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">
                        Escola de Ministros Comunidade Nacional
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default UnitsPage;
