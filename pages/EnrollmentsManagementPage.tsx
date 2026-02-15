
import React, { useState } from 'react';
import { Student } from '../types';
import { CheckCircle, XCircle, Search, Mail, Phone, Calendar, UserPlus, Trash2, Eye } from 'lucide-react';
import { supabase } from '../supabase';

interface EnrollmentsManagementPageProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

const EnrollmentsManagementPage: React.FC<EnrollmentsManagementPageProps> = ({ students, setStudents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const pendingStudents = students.filter(s => s.status === 'INACTIVE' && s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const approveEnrollment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ status: 'ACTIVE' })
        .eq('id', id);

      if (error) throw error;
      setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'ACTIVE' } : s));
    } catch (err: any) {
      alert('Erro ao aprovar: ' + err.message);
    }
  };

  const deleteEnrollment = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta inscrição?')) return;
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestão de Inscrições</h2>
          <p className="text-slate-500 text-sm">Valide os alunos que se inscreveram através do link público.</p>
        </div>
        <div className="bg-emcn-gold/10 text-emcn-gold px-4 py-2 rounded-lg border border-emcn-gold/20 font-bold flex items-center gap-2">
          <UserPlus size={18} />
          {pendingStudents.length} Pendentes
        </div>
      </div>

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome do candidato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-1 focus:ring-emcn-gold outline-none"
            />
          </div>
        </div>

        {pendingStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-center w-20">Avatar</th>
                  <th className="px-6 py-4">Candidato</th>
                  <th className="px-6 py-4 hidden md:table-cell">Contato</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Data Inscrição</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pendingStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50 group transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-10 h-10 rounded-full bg-emcn-gold/10 flex items-center justify-center font-bold text-emcn-gold mx-auto">
                        {student.name.charAt(0)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{student.name}</div>
                      <div className="text-xs text-slate-500 md:hidden">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Mail size={12} className="text-slate-400" /> {student.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Phone size={12} className="text-slate-400" /> {student.phone || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {new Date(student.enrollmentDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => approveEnrollment(student.id)}
                          title="Aprovar Aluno"
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => deleteEnrollment(student.id)}
                          title="Rejeitar Inscrição"
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <UserPlus size={40} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-700">Nenhuma inscrição pendente</h3>
              <p className="text-slate-500 max-w-xs mx-auto">Novas inscrições feitas pelo link público aparecerão aqui para sua validação.</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-emcn-blue p-6 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emcn-gold rounded-xl flex items-center justify-center text-emcn-blue">
            <Eye size={24} />
          </div>
          <div>
            <h4 className="font-bold">Dica de Segurança</h4>
            <p className="text-sm text-slate-300">Verifique os dados de contato antes de aprovar a entrada do aluno no sistema oficial.</p>
          </div>
        </div>
        <button className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-all border border-white/10">
          Relatório de Inscrições
        </button>
      </div>
    </div>
  );
};

export default EnrollmentsManagementPage;
