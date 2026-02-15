
import React, { useState, useEffect } from 'react';
import { EnrollmentSettings, UserRole, Permission } from '../types';
import { Settings, Shield, BadgeCheck, Loader2, CheckCircle2, Save, Users, Lock } from 'lucide-react';
import { supabase } from '../supabase';

interface ConfigPageProps {
    settings: EnrollmentSettings;
    setSettings: React.Dispatch<React.SetStateAction<EnrollmentSettings>>;
}

const ConfigPage: React.FC<ConfigPageProps> = ({ settings, setSettings }) => {
    const [activeTab, setActiveTab] = useState<'SYSTEM' | 'PERMISSIONS'>('SYSTEM');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    // State for permissions management
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [permLoading, setPermLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'PERMISSIONS') {
            fetchPermissions();
        }
    }, [activeTab]);

    const fetchPermissions = async () => {
        setPermLoading(true);
        try {
            const { data, error } = await supabase.from('permissions').select('*');
            if (!error && data) setPermissions(data as Permission[]);
        } catch (err) {
            console.error('Error fetching permissions:', err);
        } finally {
            setPermLoading(false);
        }
    };

    const handleSaveSystem = async () => {
        setSaving(true);
        setSuccess(false);
        try {
            const { error } = await supabase
                .from('system_settings')
                .update({
                    is_open: settings.isOpen,
                    deadline: settings.deadline,
                    message: settings.message,
                    updated_at: new Date().toISOString()
                })
                .eq('id', 1);

            if (error) throw error;
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error: any) {
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const togglePermission = async (permId: string, field: keyof Permission) => {
        const perm = permissions.find(p => p.id === permId);
        if (!perm) return;

        const newValue = !perm[field];

        // Optimistic update
        setPermissions(prev => prev.map(p => p.id === permId ? { ...p, [field]: newValue } : p));

        try {
            await supabase.from('permissions').update({ [field]: newValue }).eq('id', permId);
        } catch (err) {
            // Rollback on error
            setPermissions(prev => prev.map(p => p.id === permId ? { ...p, [field]: !newValue } : p));
            console.error('Error updating permission:', err);
        }
    };

    const modules = [
        { id: 'DASHBOARD', label: 'Dashboard / Visão Geral' },
        { id: 'STUDENTS', label: 'Gestão de Alunos' },
        { id: 'TEACHERS', label: 'Gestão de Professores' },
        { id: 'CLASSES', label: 'Gerenciamento de Turmas' },
        { id: 'ENROLLMENTS', label: 'Validação de Inscrições' },
        { id: 'SCHOOLS', label: 'Configuração de Unidades' },
        { id: 'CONFIG', label: 'Configurações do Sistema' },
    ];

    const roles: { id: UserRole, label: string }[] = [
        { id: 'ADMIN', label: 'Administrador' },
        { id: 'SECRETARY', label: 'Secretaria' },
        { id: 'TEACHER', label: 'Professor' },
        { id: 'STUDENT', label: 'Aluno' },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Settings className="text-emcn-gold" />
                        Configurações e Segurança
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Configure o comportamento global e permissões de acesso.</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('SYSTEM')}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'SYSTEM' ? 'bg-white shadow-sm text-emcn-blue' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Settings size={16} /> Sistema
                    </button>
                    <button
                        onClick={() => setActiveTab('PERMISSIONS')}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'PERMISSIONS' ? 'bg-white shadow-sm text-emcn-blue' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Shield size={16} /> Permissões
                    </button>
                </div>
            </div>

            {activeTab === 'SYSTEM' ? (
                <div className="max-w-3xl bg-white p-8 rounded-2xl shadow-sm border space-y-8 animate-in fade-in duration-300">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Users size={20} className="text-emcn-gold" /> Inscrições Públicas
                        </h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <div className="font-bold text-slate-800">Status Geral do Link</div>
                                    <div className="text-sm text-slate-500 font-medium">Habilitar ou desabilitar o formulário de autoinscrição.</div>
                                </div>
                                <button
                                    onClick={() => setSettings(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                                    className={`w-14 h-7 rounded-full transition-all relative ${settings.isOpen ? 'bg-green-500' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${settings.isOpen ? 'left-8' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Data Limite Global</label>
                                    <input
                                        type="date"
                                        value={settings.deadline}
                                        onChange={(e) => setSettings(prev => ({ ...prev, deadline: e.target.value }))}
                                        className="w-full px-4 py-3 border-2 border-slate-50 rounded-xl focus:border-emcn-gold outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Ano de Referência</label>
                                    <input type="number" readOnly value={new Date().getFullYear()} className="w-full px-4 py-3 border-2 border-slate-50 rounded-xl bg-slate-50 text-slate-400 font-bold" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Mensagem de Instruções Padrão</label>
                                <textarea
                                    value={settings.message}
                                    onChange={(e) => setSettings(prev => ({ ...prev, message: e.target.value }))}
                                    className="w-full px-4 py-3 border-2 border-slate-50 rounded-xl h-32 focus:border-emcn-gold outline-none"
                                    placeholder="Instruções exibidas no topo da página de inscrição..."
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSaveSystem}
                        disabled={saving}
                        className="w-full bg-emcn-blue text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emcn-blue/10"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : success ? <CheckCircle2 size={20} /> : <Save size={20} />}
                        {saving ? 'Salvando...' : success ? 'Configurações Salvas!' : 'Salvar Todas as Alterações'}
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden animate-in fade-in duration-300">
                    <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Matriz de Acessos</h3>
                            <p className="text-sm text-slate-500 font-medium">Defina o que cada perfil pode realizar dentro dos módulos.</p>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest bg-emcn-gold/10 text-emcn-gold px-3 py-1.5 rounded-full border border-emcn-gold/20 flex items-center gap-2">
                            <Lock size={12} /> Segurança RBAC Ativa
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="px-6 py-4">Módulo do Sistema</th>
                                    {roles.map(role => <th key={role.id} className="px-6 py-4 text-center">{role.label}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {modules.map(module => (
                                    <tr key={module.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-slate-700">{module.label}</div>
                                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">ID: {module.id}</div>
                                        </td>
                                        {roles.map(role => {
                                            // Find permission for this role and module
                                            const perm = permissions.find(p => p.role === role.id && p.module === module.id);
                                            const isAllowed = perm ? perm.canView : (role.id === 'ADMIN'); // Admins usually default to true
                                            const permId = perm?.id;

                                            return (
                                                <td key={role.id} className="px-6 py-5 text-center">
                                                    <button
                                                        disabled={role.id === 'ADMIN'}
                                                        onClick={() => permId && togglePermission(permId, 'canView')}
                                                        className={`w-12 h-6 rounded-full transition-all relative inline-block mx-auto ${isAllowed ? 'bg-emcn-gold' : 'bg-slate-200'} ${role.id === 'ADMIN' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-xs transition-all ${isAllowed ? 'left-7' : 'left-1'}`} />
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 bg-amber-50 border-t border-amber-100 flex items-start gap-3">
                        <Shield className="text-amber-500 shrink-0" size={20} />
                        <div className="text-xs text-amber-800 leading-relaxed">
                            <span className="font-bold">Atenção:</span> O perfil de <span className="font-bold">Administrador</span> possui acesso raiz e irrevogável a todas as funções por segurança. Alterações efetuadas nesta matriz são aplicadas em tempo real para todos os usuários com o perfil correspondente.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConfigPage;
