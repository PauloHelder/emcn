
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Plus, Search, Edit, Trash2, X, Shield, Mail, BadgeCheck, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<Partial<User> & { password?: string }>({ role: 'STUDENT', status: 'ACTIVE', password: '' });
    const [saving, setSaving] = useState(false);

    const [searchingEmail, setSearchingEmail] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('profiles').select('*').order('name');
            if (error) throw error;
            setUsers(data as User[]);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkEmail = async (email: string) => {
        if (!email || formData.id) return;
        setSearchingEmail(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', email)
                .single();

            if (data) {
                if (confirm(`O e-mail ${email} já possui um cadastro (Cargo: ${data.role}). Deseja carregar os dados para edição?`)) {
                    setFormData(data);
                }
            }
        } catch (err) {
            // Not found is fine
        } finally {
            setSearchingEmail(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                status: formData.status,
                updated_at: new Date().toISOString()
            };

            if (formData.id) {
                // Update existing profile
                const { error } = await supabase
                    .from('profiles')
                    .update(payload)
                    .eq('id', formData.id);
                if (error) throw error;
            } else {
                // Create new user in Auth
                if (!formData.password) throw new Error('A senha é obrigatória para novos usuários.');

                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: formData.email!,
                    password: formData.password!,
                    options: {
                        data: {
                            name: formData.name,
                            role: formData.role,
                            status: formData.status
                        }
                    }
                });

                if (authError) throw authError;

                // Sync with profiles if trigger doesn't exist (Supabase might already do this if trigger is set)
                // We attempt to update the newly created profile with the extra metadata
                if (authData.user) {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .update({
                            name: formData.name,
                            role: formData.role,
                            status: formData.status
                        })
                        .eq('id', authData.user.id);
                    // We don't throw here because if a trigger created the profile, this update is just extra insurance
                }
            }
            setShowForm(false);
            fetchUsers();
        } catch (err: any) {
            alert('Erro ao salvar usuário: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role: UserRole) => {
        const roles: Record<UserRole, { label: string, color: string }> = {
            ADMIN: { label: 'Administrador', color: 'bg-red-100 text-red-700' },
            SECRETARY: { label: 'Secretaria', color: 'bg-blue-100 text-blue-700' },
            TEACHER: { label: 'Professor', color: 'bg-purple-100 text-purple-700' },
            STUDENT: { label: 'Aluno', color: 'bg-green-100 text-green-700' }
        };
        const r = roles[role] || roles.STUDENT;
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${r.color}`}>{r.label}</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Gestão de Usuários</h2>
                    <p className="text-sm text-slate-500 mt-1">Gerencie os acessos e perfis do sistema.</p>
                </div>
                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-1 focus:ring-emcn-gold outline-none"
                        />
                    </div>
                    <button
                        onClick={() => { setFormData({ role: 'STUDENT', status: 'ACTIVE', password: '' }); setShowForm(true); }}
                        className="px-4 py-2 bg-emcn-blue text-white rounded-lg flex items-center gap-2 font-semibold shadow-md hover:bg-slate-800 transition-colors shrink-0"
                    >
                        <Plus size={18} /> Novo Usuário
                    </button>
                </div>
            </div>

            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Nome</th>
                            <th className="px-6 py-4">E-mail</th>
                            <th className="px-6 py-4">Perfil</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center"><Loader2 className="animate-spin mx-auto text-emcn-gold" /></td>
                            </tr>
                        ) : filteredUsers.length > 0 ? filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 font-medium text-slate-800">{user.name}</td>
                                <td className="px-6 py-4 text-slate-500 text-sm">{user.email}</td>
                                <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                                <td className="px-6 py-4">
                                    <span className={`w-2 h-2 rounded-full inline-block mr-2 ${user.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-300'}`} />
                                    <span className="text-sm text-slate-600">{user.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setFormData(user); setShowForm(true); }} className="p-2 text-slate-400 hover:text-emcn-blue"><Edit size={16} /></button>
                                        <button className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">Nenhum usuário encontrado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                        <div className="bg-emcn-blue p-6 text-white flex justify-between items-center relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
                            <h3 className="text-xl font-bold relative z-10">{formData.id ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                            <button onClick={() => setShowForm(false)} className="hover:bg-white/10 p-1 rounded-lg relative z-10"><X /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-8 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">E-mail de Acesso</label>
                                <div className="relative">
                                    <input
                                        required
                                        type="email"
                                        disabled={!!formData.id}
                                        value={formData.email || ''}
                                        onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                                        onBlur={(e) => checkEmail(e.target.value)}
                                        className={`w-full px-4 py-2 border-2 border-slate-50 rounded-xl focus:border-emcn-gold outline-none ${formData.id ? 'bg-slate-50 text-slate-500' : ''}`}
                                    />
                                    {searchingEmail && <Loader2 className="absolute right-3 top-2.5 animate-spin text-emcn-gold" size={18} />}
                                </div>
                                {!formData.id && <p className="text-[10px] text-slate-400 mt-1">Digite o e-mail para verificar se já existe um cadastro.</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Nome Completo</label>
                                <input required value={formData.name || ''} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2 border-2 border-slate-50 rounded-xl focus:border-emcn-gold outline-none" />
                            </div>
                            {!formData.id && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Senha Inicial</label>
                                    <input
                                        required
                                        type="password"
                                        placeholder="Mínimo 6 caracteres"
                                        value={formData.password || ''}
                                        onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                                        className="w-full px-4 py-2 border-2 border-slate-50 rounded-xl focus:border-emcn-gold outline-none"
                                    />
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Perfil / Role</label>
                                    <select value={formData.role} onChange={(e) => setFormData(p => ({ ...p, role: e.target.value as UserRole }))} className="w-full px-4 py-2 border-2 border-slate-50 rounded-xl bg-white focus:border-emcn-gold outline-none">
                                        <option value="ADMIN">Administrador</option>
                                        <option value="SECRETARY">Secretaria</option>
                                        <option value="TEACHER">Professor</option>
                                        <option value="STUDENT">Aluno</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Status</label>
                                    <select value={formData.status} onChange={(e) => setFormData(p => ({ ...p, status: e.target.value as any }))} className="w-full px-4 py-2 border-2 border-slate-50 rounded-xl bg-white focus:border-emcn-gold outline-none">
                                        <option value="ACTIVE">Ativo</option>
                                        <option value="INACTIVE">Inativo</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                                <button type="submit" disabled={saving} className="flex-1 py-3 bg-emcn-gold text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
                                    {saving && <Loader2 size={16} className="animate-spin" />}
                                    {formData.id ? 'Salvar Alterações' : 'Criar Conta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
