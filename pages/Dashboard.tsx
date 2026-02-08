
import React from 'react';
import { Link } from 'react-router-dom';
import { Teacher, Student, Discipline, ClassGroup } from '../types';
import { Users, GraduationCap, BookOpen, Layers, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  stats: {
    teachers: Teacher[];
    students: Student[];
    disciplines: Discipline[];
    classes: ClassGroup[];
  };
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const pendingEnrollments = stats.students.filter(s => s.status === 'INACTIVE').length;
  
  const chartData = [
    { name: 'Professores', value: stats.teachers.length },
    { name: 'Alunos Ativos', value: stats.students.filter(s => s.status === 'ACTIVE').length },
    { name: 'Disciplinas', value: stats.disciplines.length },
    { name: 'Turmas', value: stats.classes.length },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Alunos Ativos" value={stats.students.filter(s => s.status === 'ACTIVE').length} icon={Users} color="blue" />
        <StatCard title="Professores" value={stats.teachers.length} icon={GraduationCap} color="gold" />
        <StatCard title="Disciplinas" value={stats.disciplines.length} icon={BookOpen} color="blue" />
        <StatCard title="Turmas Atuais" value={stats.classes.length} icon={Layers} color="gold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-emcn-gold" />
            Visão Geral do Sistema
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0a2e4e' : '#c5a059'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <AlertCircle size={20} className="text-emcn-gold" />
            Ações Pendentes
          </h3>
          <div className="space-y-4">
            <Link to="/inscricoes-gestao" className="block p-4 bg-orange-50 border border-orange-100 rounded-xl hover:bg-orange-100 transition-colors group">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-orange-800 text-sm">Validar Inscrições</div>
                  <p className="text-xs text-orange-600 mt-1">Existem {pendingEnrollments} novas autoinscrições aguardando revisão.</p>
                </div>
                <ArrowRight size={16} className="text-orange-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="font-semibold text-blue-800 text-sm">Chamada do Dia</div>
              <p className="text-xs text-blue-600 mt-1">Turma Alfa 2024 tem aula hoje às 19:30.</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="font-semibold text-slate-800 text-sm">Relatório Mensal</div>
              <p className="text-xs text-slate-500 mt-1">O relatório de presença de Junho está pronto para exportação.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => {
  const isGold = color === 'gold';
  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${isGold ? 'bg-emcn-gold/10 text-emcn-gold' : 'bg-emcn-blue/10 text-emcn-blue'}`}>
          <Icon size={24} />
        </div>
        <div>
          <div className="text-slate-500 text-sm font-medium">{title}</div>
          <div className="text-2xl font-bold text-slate-800">{value}</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
