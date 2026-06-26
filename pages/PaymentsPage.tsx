import React, { useState, useEffect } from 'react';
import { ClassGroup, Student, Payment } from '../types';
import { 
  CreditCard, 
  Search, 
  Filter, 
  PlusCircle, 
  History, 
  TrendingUp, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Calendar, 
  DollarSign, 
  User,
  Edit,
  Trash2,
  X 
} from 'lucide-react';
import { supabase } from '../supabase';

interface PaymentsPageProps {
  classes: ClassGroup[];
  students: Student[];
}

const PaymentsPage: React.FC<PaymentsPageProps> = ({ classes, students }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedStudentForPay, setSelectedStudentForPay] = useState<Student | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);

  // Form state
  const [monthsPaid, setMonthsPaid] = useState<number>(1);
  const [paymentAmount, setPaymentAmount] = useState<string>('0.00');
  const [customAmountUsed, setCustomAmountUsed] = useState(false);
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [refMonth, setRefMonth] = useState<string>('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    if (selectedClassId) {
      fetchPayments();
    }
  }, [selectedClassId]);

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('class_id', selectedClassId);

      if (error) throw error;

      setPayments((data || []).map((p: any) => ({
        id: p.id,
        studentId: p.student_id,
        classId: p.class_id,
        amount: Number(p.amount),
        paymentDate: p.payment_date,
        monthsPaid: p.months_paid,
        referenceMonth: p.reference_month
      })));
    } catch (err) {
      console.error('Erro ao buscar pagamentos:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);

  // Auto-fill amount based on months_paid and class fee
  useEffect(() => {
    if (selectedClass && !customAmountUsed) {
      const fee = selectedClass.monthlyFee || 0;
      setPaymentAmount((fee * monthsPaid).toFixed(2));
    }
  }, [monthsPaid, selectedClass, customAmountUsed]);

  // Helper: check if targetMonth (YYYY-MM) is covered by a payment starting at referenceMonth (YYYY-MM) for X months
  const isMonthCovered = (paymentRefMonth: string, monthsCount: number, targetMonth: string) => {
    const getMonthOffset = (ym: string) => {
      const [y, m] = ym.split('-').map(Number);
      return y * 12 + (m - 1);
    };
    const paymentOffset = getMonthOffset(paymentRefMonth);
    const targetOffset = getMonthOffset(targetMonth);
    return targetOffset >= paymentOffset && targetOffset < paymentOffset + monthsCount;
  };

  // Filter students in selected class
  const classStudents = selectedClass 
    ? students.filter(s => selectedClass.students?.includes(s.id))
    : [];

  const filteredStudents = classStudents
    .filter(student => 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  // Financial calculations
  // 1. Total received: Payments made physically in the selected month
  const physicalPaymentsInSelectedMonth = payments.filter(p => p.paymentDate.startsWith(selectedMonth));
  const totalCollected = physicalPaymentsInSelectedMonth.reduce((acc, curr) => acc + curr.amount, 0);

  // 2. Expected revenue: class monthly fee * total students in class
  const estimatedAmount = selectedClass?.monthlyFee 
    ? selectedClass.monthlyFee * classStudents.length 
    : 0;

  // 3. Difference
  const difference = totalCollected - estimatedAmount;

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedStudentForPay) return;

    setSubmittingPayment(true);
    try {
      const payload = {
        student_id: selectedStudentForPay.id,
        class_id: selectedClass.id,
        amount: parseFloat(paymentAmount),
        payment_date: paymentDate,
        months_paid: monthsPaid,
        reference_month: refMonth
      };

      if (editingPayment) {
        // Update payment
        const { error } = await supabase
          .from('payments')
          .update(payload)
          .eq('id', editingPayment.id);

        if (error) throw error;

        alert('Pagamento atualizado com sucesso!');

        setPayments(prev => prev.map(p => p.id === editingPayment.id ? {
          ...p,
          amount: payload.amount,
          paymentDate: payload.payment_date,
          monthsPaid: payload.months_paid,
          referenceMonth: payload.reference_month
        } : p));
      } else {
        // Insert payment
        const { data, error } = await supabase
          .from('payments')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;

        alert('Pagamento registrado com sucesso!');
        
        const newPayment: Payment = {
          id: data.id,
          studentId: data.student_id,
          classId: data.class_id,
          amount: Number(data.amount),
          paymentDate: data.payment_date,
          monthsPaid: data.months_paid,
          referenceMonth: data.reference_month
        };

        setPayments(prev => [newPayment, ...prev]);
      }

      setShowRegisterModal(false);
      setSelectedStudentForPay(null);
      setEditingPayment(null);
      setMonthsPaid(1);
      setCustomAmountUsed(false);
    } catch (err: any) {
      alert('Erro ao processar pagamento: ' + err.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Deseja realmente excluir este registro de pagamento?')) return;
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;

      alert('Pagamento excluído com sucesso!');
      setPayments(prev => prev.filter(p => p.id !== paymentId));
    } catch (err: any) {
      alert('Erro ao excluir pagamento: ' + err.message);
    }
  };

  const getFormatMonthName = (ym: string) => {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    const date = new Date(Number(y), Number(m) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-serif text-slate-800 flex items-center gap-3">
          <CreditCard className="text-emcn-gold" size={32} /> Gestão Financeira / Mensalidades
        </h2>
        <p className="text-slate-500 font-medium mt-1">Monitore mensalidades, faturamento estimado e controle de adimplência.</p>
      </div>

      {/* Dropdown Filters */}
      <div className="bg-white p-8 rounded-[32px] border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Filter size={14} className="text-emcn-gold" /> Selecione a Turma
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 font-semibold text-slate-700 focus:border-emcn-gold focus:outline-none transition-all duration-300 cursor-pointer"
          >
            <option value="">Selecione uma turma...</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.year})</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar size={14} className="text-emcn-gold" /> Mês de Referência
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 font-semibold text-slate-700 focus:border-emcn-gold focus:outline-none transition-all duration-300 cursor-pointer"
          />
        </div>
      </div>

      {/* Main content display */}
      {!selectedClassId ? (
        <div className="bg-white p-16 rounded-[40px] border border-slate-100 text-center max-w-2xl mx-auto shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 border border-slate-100">
            <CreditCard size={40} className="text-slate-300" />
          </div>
          <h3 className="text-2xl font-serif text-slate-800 mb-3">Selecione uma Turma</h3>
          <p className="text-slate-500 leading-relaxed max-w-md mx-auto">
            Escolha uma turma nos filtros acima para visualizar o status das mensalidades e registrar novos pagamentos.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[28px] border shadow-sm flex flex-col justify-between h-36">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Valor Total Arrecadado</p>
                <p className="text-xs text-slate-400 font-semibold mb-2">Faturamento físico em {getFormatMonthName(selectedMonth)}</p>
              </div>
              <p className="text-3xl font-serif font-black text-slate-800">
                {totalCollected.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
              </p>
            </div>

            <div className="bg-white p-6 rounded-[28px] border shadow-sm flex flex-col justify-between h-36">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Faturamento Estimado</p>
                <p className="text-xs text-slate-400 font-semibold mb-2">
                  Mensalidade: {(selectedClass?.monthlyFee || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                </p>
              </div>
              <p className="text-3xl font-serif font-black text-slate-800">
                {estimatedAmount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
              </p>
            </div>

            <div className="bg-white p-6 rounded-[28px] border shadow-sm flex flex-col justify-between h-36">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Diferença</p>
                <p className="text-xs text-slate-400 font-semibold mb-2">Total Arrecadado vs Estimado</p>
              </div>
              <p className={`text-3xl font-serif font-black ${difference >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {difference.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
              </p>
            </div>
          </div>

          {/* Student Status List */}
          <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
              <h3 className="font-serif text-lg text-slate-800 font-bold">Relação de Mensalidades da Turma</h3>
              <div className="relative w-full sm:w-72">
                <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar aluno..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm font-semibold text-slate-700 focus:border-emcn-gold focus:outline-none transition-all"
                />
              </div>
            </div>

            {loadingPayments ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-emcn-gold" size={40} />
                <p className="text-slate-500 font-medium">Carregando dados financeiros...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <User size={48} className="mx-auto mb-4 opacity-20" />
                <p>Nenhum aluno localizado nesta turma.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/20">
                      <th className="px-6 py-4">Aluno</th>
                      <th className="px-6 py-4">Status ({getFormatMonthName(selectedMonth).split(' de ')[0]})</th>
                      <th className="px-6 py-4">Último Pagamento</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(student => {
                      // Find payment record covering the selected month
                      const activePayment = payments.find(p => 
                        p.studentId === student.id && 
                        isMonthCovered(p.referenceMonth, p.monthsPaid, selectedMonth)
                      );
                      
                      const isPaid = !!activePayment;

                      // Find the latest payment made by this student
                      const studentPayments = payments.filter(p => p.studentId === student.id);
                      const latestPayment = studentPayments.length > 0
                        ? studentPayments.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))[0]
                        : null;

                      return (
                        <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-all">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-650 font-bold border">
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{student.name}</p>
                                <p className="text-xs text-slate-400 font-semibold">{student.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            {isPaid ? (
                              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 flex items-center gap-1.5 w-fit">
                                <CheckCircle2 size={13} /> Pago
                              </span>
                            ) : (
                              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-700 flex items-center gap-1.5 w-fit">
                                <AlertCircle size={13} /> Pendente
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-sm font-semibold text-slate-650">
                            {latestPayment ? (
                              <div>
                                <p className="text-slate-700">
                                  {latestPayment.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                                </p>
                                <p className="text-[10px] text-slate-400 font-normal">
                                  Data: {new Date(latestPayment.paymentDate + 'T12:00:00').toLocaleDateString('pt-BR')} (Ref: {getFormatMonthName(latestPayment.referenceMonth)})
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-350 italic text-xs font-normal">Sem registros</span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-right space-x-2">
                            <button
                              onClick={() => {
                                setSelectedStudentForPay(student);
                                setRefMonth(selectedMonth);
                                setPaymentDate(new Date().toISOString().split('T')[0]);
                                setShowRegisterModal(true);
                              }}
                              className="px-4 py-2 bg-emcn-blue text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <PlusCircle size={14} /> Receber
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStudentForHistory(student);
                                setShowHistoryModal(true);
                              }}
                              className="px-4 py-2 border-2 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold text-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <History size={14} /> Histórico
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REGISTER PAYMENT MODAL */}
      {showRegisterModal && selectedStudentForPay && selectedClass && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[36px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="bg-emcn-blue p-6 text-white flex justify-between items-center shrink-0">
              <div>
                <span className="text-[10px] text-emcn-gold font-black uppercase tracking-widest">
                  {editingPayment ? 'Editar Lançamento' : 'Registrar Transação'}
                </span>
                <h3 className="text-lg font-serif mt-0.5">Mensalidade: {selectedStudentForPay.name}</h3>
              </div>
              <button 
                onClick={() => { setShowRegisterModal(false); setSelectedStudentForPay(null); setEditingPayment(null); }}
                className="hover:bg-white/10 p-2 rounded-xl text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegisterPayment} className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Turma Atual / Mensalidade</label>
                <div className="bg-slate-50 p-4 rounded-2xl border flex justify-between items-center text-sm font-semibold text-slate-700">
                  <span>{selectedClass.name}</span>
                  <span className="text-emcn-blue">
                    {(selectedClass.monthlyFee || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} / mês
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Meses Pagos</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={monthsPaid}
                    onChange={(e) => {
                      setMonthsPaid(Math.max(1, parseInt(e.target.value) || 1));
                    }}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 font-semibold text-slate-700 focus:border-emcn-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mês de Referência</label>
                  <input
                    type="month"
                    required
                    value={refMonth}
                    onChange={(e) => setRefMonth(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 font-semibold text-slate-700 focus:border-emcn-gold focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Valor Cobrado</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-450 font-bold text-sm">Kz</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={paymentAmount}
                    onChange={(e) => {
                      setPaymentAmount(e.target.value);
                      setCustomAmountUsed(true);
                    }}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-11 pr-4 py-2.5 font-bold text-slate-700 focus:border-emcn-gold focus:outline-none"
                  />
                </div>
                {customAmountUsed && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomAmountUsed(false);
                      setMonthsPaid(monthsPaid); // triggers recalculation effect
                    }}
                    className="text-[10px] text-emcn-gold font-bold uppercase mt-1 hover:underline"
                  >
                    Resetar para valor padrão
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Data do Pagamento</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 font-semibold text-slate-700 focus:border-emcn-gold focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowRegisterModal(false); setSelectedStudentForPay(null); setEditingPayment(null); }}
                  className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="flex-1 py-3 bg-emcn-gold text-white font-bold rounded-xl shadow-lg hover:bg-[#b08e4d] transition-all flex items-center justify-center gap-2"
                >
                  {submittingPayment ? <Loader2 size={16} className="animate-spin" /> : (editingPayment ? 'Salvar Alterações' : 'Confirmar Recebimento')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT HISTORY MODAL */}
      {showHistoryModal && selectedStudentForHistory && selectedClass && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[36px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="bg-emcn-blue p-6 text-white flex justify-between items-center shrink-0">
              <div>
                <span className="text-[10px] text-emcn-gold font-black uppercase tracking-widest">Histórico Completo</span>
                <h3 className="text-lg font-serif mt-0.5">{selectedStudentForHistory.name}</h3>
              </div>
              <button 
                onClick={() => { setShowHistoryModal(false); setSelectedStudentForHistory(null); }}
                className="hover:bg-white/10 p-2 rounded-xl text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border text-sm text-slate-650 leading-relaxed">
                Mostrando todos os registros de mensalidades recebidas na turma <strong className="text-slate-800">{selectedClass.name}</strong>.
              </div>

              <div className="space-y-3">
                {payments.filter(p => p.studentId === selectedStudentForHistory.id).length === 0 ? (
                  <div className="py-12 text-center text-slate-400 border border-dashed rounded-2xl">
                    <History size={36} className="mx-auto mb-2 opacity-20" />
                    <p className="text-xs">Nenhum pagamento registrado para este aluno.</p>
                  </div>
                ) : (
                  payments
                    .filter(p => p.studentId === selectedStudentForHistory.id)
                    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
                    .map(p => (
                      <div key={p.id} className="bg-white p-5 rounded-2xl border-2 border-slate-100 hover:border-slate-200 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Calendar size={12} className="text-emcn-gold" /> Ref: {getFormatMonthName(p.referenceMonth)}
                          </p>
                          <p className="text-sm font-semibold text-slate-700">
                            Cobertura: {p.monthsPaid} {p.monthsPaid === 1 ? 'mês' : 'meses'} pago(s)
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Data física: {new Date(p.paymentDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-right">
                            <span className="text-lg font-serif font-black text-emcn-blue block">
                              {p.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingPayment(p);
                                const student = students.find(s => s.id === p.studentId) || null;
                                setSelectedStudentForPay(student);
                                setMonthsPaid(p.monthsPaid);
                                setPaymentAmount(p.amount.toFixed(2));
                                setPaymentDate(p.paymentDate);
                                setRefMonth(p.referenceMonth);
                                setCustomAmountUsed(true);
                                setShowRegisterModal(true);
                                setShowHistoryModal(false);
                              }}
                              className="p-2 text-slate-400 hover:text-emcn-blue hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar pagamento"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeletePayment(p.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir pagamento"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="p-6 border-t bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={() => { setShowHistoryModal(false); setSelectedStudentForHistory(null); }}
                className="px-8 py-3 bg-emcn-blue text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
