import React, { useState, useEffect } from 'react';
import { EadLesson, ClassGroup, Discipline, EadAttachment, EadDisciplineAttachment } from '../types';
import { supabase } from '../supabase';
import {
  BookOpen, Video, Plus, Edit, Trash2, ArrowLeft, Loader2, Save, X,
  ExternalLink, School, ChevronRight, PlayCircle, GraduationCap, Layers, Calendar,
  Paperclip, FileText, Image as ImageIcon, Link as LinkIcon, ChevronUp, ChevronDown
} from 'lucide-react';

interface EadAdminPageProps {
  classes: ClassGroup[];
  disciplines: Discipline[];
  setDisciplines: React.Dispatch<React.SetStateAction<Discipline[]>>;
}

const EadAdminPage: React.FC<EadAdminPageProps> = ({ classes, disciplines, setDisciplines }) => {
  // Navigation state: Class → Discipline → Lessons
  const [selectedClass, setSelectedClass] = useState<ClassGroup | null>(null);
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string | null>(null);

  // Lesson data
  const [lessons, setLessons] = useState<EadLesson[]>([]);
  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // Discipline Attachments state
  const [disciplineAttachments, setDisciplineAttachments] = useState<EadDisciplineAttachment[]>([]);
  const [showDisciplineAttModal, setShowDisciplineAttModal] = useState(false);
  const [discAttForm, setDiscAttForm] = useState<{ title: string; url: string; type: 'DOCUMENT' | 'IMAGE' }>({
    title: '',
    url: '',
    type: 'DOCUMENT'
  });
  const [savingDiscAtt, setSavingDiscAtt] = useState(false);

  // Lesson form
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonForm, setLessonForm] = useState<Partial<EadLesson>>({ attachments: [] });
  const [saving, setSaving] = useState(false);

  // Fetch lesson counts for all class+discipline combos when a class is selected
  useEffect(() => {
    if (!selectedClass) return;
    fetchLessonCounts(selectedClass.id);
  }, [selectedClass?.id]);

  // Fetch lessons & discipline attachments when a discipline is selected
  useEffect(() => {
    if (!selectedClass || !selectedDisciplineId) return;
    fetchLessons(selectedClass.id, selectedDisciplineId);
    fetchDisciplineAttachments(selectedClass.id, selectedDisciplineId);
  }, [selectedClass?.id, selectedDisciplineId]);

  const fetchLessonCounts = async (classId: string) => {
    const { data } = await supabase
      .from('ead_lessons')
      .select('discipline_id')
      .eq('class_id', classId);
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((row: any) => {
        counts[row.discipline_id] = (counts[row.discipline_id] || 0) + 1;
      });
      setLessonCounts(counts);
    }
  };

  const fetchLessons = async (classId: string, disciplineId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ead_lessons')
      .select('*')
      .eq('class_id', classId)
      .eq('discipline_id', disciplineId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (!error && data) {
      // Normalize order_index sequence if any 0 or duplicates exist
      const normalized = data.map((item: EadLesson, idx: number) => ({
        ...item,
        order_index: item.order_index && item.order_index > 0 ? item.order_index : idx + 1
      }));
      setLessons(normalized);
    }
    setLoading(false);
  };

  const handleMoveLessonOrder = async (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === lessons.length - 1) return;

    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    const currentLesson = lessons[index];
    const targetLesson = lessons[targetIndex];

    const currentOrder = currentLesson.order_index || (index + 1);
    const targetOrder = targetLesson.order_index || (targetIndex + 1);

    let newCurrentOrder = targetOrder;
    let newTargetOrder = currentOrder;

    if (newCurrentOrder === newTargetOrder) {
      newCurrentOrder = direction === 'UP' ? targetIndex + 1 : targetIndex + 1;
      newTargetOrder = index + 1;
    }

    try {
      // Optimistic update
      const updatedLessons = [...lessons];
      updatedLessons[index] = { ...currentLesson, order_index: newCurrentOrder };
      updatedLessons[targetIndex] = { ...targetLesson, order_index: newTargetOrder };
      updatedLessons.sort((a, b) => a.order_index - b.order_index);
      setLessons(updatedLessons);

      // Save to Supabase
      const { error: err1 } = await supabase.from('ead_lessons').update({ order_index: newCurrentOrder }).eq('id', currentLesson.id);
      const { error: err2 } = await supabase.from('ead_lessons').update({ order_index: newTargetOrder }).eq('id', targetLesson.id);

      if (err1 || err2) throw err1 || err2;

      if (selectedClass && selectedDisciplineId) {
        await fetchLessons(selectedClass.id, selectedDisciplineId);
      }
    } catch (err: any) {
      alert('Erro ao reordenar aula: ' + err.message);
      if (selectedClass && selectedDisciplineId) {
        fetchLessons(selectedClass.id, selectedDisciplineId);
      }
    }
  };

  const fetchDisciplineAttachments = async (classId: string, disciplineId: string) => {
    try {
      const { data, error } = await supabase
        .from('ead_discipline_attachments')
        .select('*')
        .eq('class_id', classId)
        .eq('discipline_id', disciplineId)
        .order('created_at', { ascending: true });
      if (!error && data) {
        setDisciplineAttachments(data);
      }
    } catch (err) {
      console.error('Error fetching discipline attachments:', err);
    }
  };

  const handleSaveDisciplineAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedDisciplineId) return;
    if (!discAttForm.title.trim() || !discAttForm.url.trim()) return;

    setSavingDiscAtt(true);
    try {
      const payload = {
        class_id: selectedClass.id,
        discipline_id: selectedDisciplineId,
        title: discAttForm.title.trim(),
        url: discAttForm.url.trim(),
        type: discAttForm.type
      };

      const { error } = await supabase.from('ead_discipline_attachments').insert([payload]);
      if (error) throw error;

      await fetchDisciplineAttachments(selectedClass.id, selectedDisciplineId);
      setShowDisciplineAttModal(false);
      setDiscAttForm({ title: '', url: '', type: 'DOCUMENT' });
    } catch (err: any) {
      alert('Erro ao salvar anexo da matéria: ' + err.message);
    } finally {
      setSavingDiscAtt(false);
    }
  };

  const handleDeleteDisciplineAttachment = async (id: string) => {
    if (!confirm('Deseja excluir este anexo da matéria?')) return;
    try {
      const { error } = await supabase.from('ead_discipline_attachments').delete().eq('id', id);
      if (error) throw error;
      setDisciplineAttachments(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      alert('Erro ao excluir anexo: ' + err.message);
    }
  };

  // Lesson attachment handlers
  const handleAddLessonAttachment = () => {
    const current = lessonForm.attachments || [];
    setLessonForm(prev => ({
      ...prev,
      attachments: [
        ...current,
        { id: 'att_' + Date.now(), title: '', url: '', type: 'DOCUMENT' }
      ]
    }));
  };

  const handleRemoveLessonAttachment = (index: number) => {
    const current = [...(lessonForm.attachments || [])];
    current.splice(index, 1);
    setLessonForm(prev => ({ ...prev, attachments: current }));
  };

  const handleLessonAttachmentChange = (index: number, field: keyof EadAttachment, value: string) => {
    const current = [...(lessonForm.attachments || [])];
    current[index] = { ...current[index], [field]: value };
    setLessonForm(prev => ({ ...prev, attachments: current }));
  };

  // Get unique discipline IDs used in this class's sessions, sorted by order_index
  const getClassDisciplines = (cls: ClassGroup): Discipline[] => {
    const ids = new Set(cls.sessions.map(s => s.disciplineId));
    return disciplines
      .filter(d => ids.has(d.id))
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  };

  const getDisciplineName = (id: string) => disciplines.find(d => d.id === id)?.name || 'Desconhecida';

  const handleMoveDisciplineOrder = async (list: Discipline[], index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === list.length - 1) return;

    const targetIndex = direction === 'UP' ? index - 1 : index + 1;

    // Normalize: assign sequential order_index from current visible positions
    // This fixes the case where all order_index values are 0 or duplicated
    const normalized = list.map((d, i) => ({ ...d, order_index: i + 1 }));

    // Swap the two items
    const newOrder = [...normalized];
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    // Re-assign sequential indices after swap
    const reindexed = newOrder.map((d, i) => ({ ...d, order_index: i + 1 }));

    // Optimistic UI update: merge reindexed back into global disciplines
    setDisciplines(prev => prev.map(d => {
      const found = reindexed.find(r => r.id === d.id);
      return found ? found : d;
    }));

    // Persist only the two that changed positions
    const a = reindexed[index];
    const b = reindexed[targetIndex];
    try {
      const { error: e1 } = await supabase.from('disciplines').update({ order_index: a.order_index }).eq('id', a.id);
      const { error: e2 } = await supabase.from('disciplines').update({ order_index: b.order_index }).eq('id', b.id);
      if (e1 || e2) throw e1 || e2;
    } catch (err: any) {
      alert('Erro ao reordenar matéria: ' + err.message);
      // Revert optimistic update
      setDisciplines(prev => prev.map(d => {
        const orig = list.find(o => o.id === d.id);
        return orig ? orig : d;
      }));
    }
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedDisciplineId) return;
    setSaving(true);
    try {
      const validAttachments = (lessonForm.attachments || []).filter(a => a.title.trim() && a.url.trim());

      const payload = {
        class_id: selectedClass.id,
        discipline_id: selectedDisciplineId,
        title: lessonForm.title,
        description: lessonForm.description,
        youtube_url: lessonForm.youtube_url,
        cover_image_url: lessonForm.cover_image_url || null,
        order_index: lessonForm.order_index || lessons.length + 1,
        lesson_date: lessonForm.lesson_date || null,
        attachments: validAttachments
      };

      if (lessonForm.id) {
        const { error } = await supabase.from('ead_lessons').update(payload).eq('id', lessonForm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ead_lessons').insert([payload]);
        if (error) throw error;
      }
      await fetchLessons(selectedClass.id, selectedDisciplineId);
      await fetchLessonCounts(selectedClass.id);
      setShowLessonForm(false);
      setLessonForm({ attachments: [] });
    } catch (err: any) {
      alert('Erro ao salvar aula: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta aula?')) return;
    try {
      const { error } = await supabase.from('ead_lessons').delete().eq('id', id);
      if (error) throw error;
      setLessons(prev => prev.filter(l => l.id !== id));
      if (selectedClass) fetchLessonCounts(selectedClass.id);
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const getYoutubeId = (url: string) => {
    const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  };

  // ─── LEVEL 3: Lessons view ─────────────────────────────────────────────────
  if (selectedClass && selectedDisciplineId) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Breadcrumb header */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <button onClick={() => { setSelectedClass(null); setSelectedDisciplineId(null); }} className="hover:text-emcn-blue transition-colors font-medium">Turmas</button>
            <ChevronRight size={14} />
            <button onClick={() => setSelectedDisciplineId(null)} className="hover:text-emcn-blue transition-colors font-medium">{selectedClass.name}</button>
            <ChevronRight size={14} />
            <span className="text-slate-700 font-bold">{getDisciplineName(selectedDisciplineId)}</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emcn-gold/10 rounded-2xl flex items-center justify-center">
                <Video className="text-emcn-gold" size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{getDisciplineName(selectedDisciplineId)}</h2>
                <p className="text-sm text-slate-500">{selectedClass.name} · {lessons.length} aulas em vídeo</p>
              </div>
            </div>
            
            <button
              onClick={() => { setLessonForm({ order_index: lessons.length + 1, lesson_date: new Date().toISOString().split('T')[0], attachments: [] }); setShowLessonForm(true); }}
              className="bg-emcn-blue text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg shadow-emcn-blue/20"
            >
              <Plus size={18} /> Nova Aula
            </button>
          </div>

          {/* SECTION: ANEXOS DA MATÉRIA (POSICIONADO LOGO ABAIXO DO BOTÃO NOVA AULA) */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Paperclip size={18} className="text-emcn-gold" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Anexos da Matéria / Apostilas Geral ({disciplineAttachments.length})
                </h3>
              </div>
              <button
                onClick={() => setShowDisciplineAttModal(true)}
                className="bg-emcn-gold/10 hover:bg-emcn-gold hover:text-white text-emcn-gold text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
              >
                <Plus size={14} /> Adicionar Anexo à Matéria
              </button>
            </div>

            {disciplineAttachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {disciplineAttachments.map(att => (
                  <div key={att.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {att.type === 'IMAGE' ? (
                        <ImageIcon size={16} className="text-blue-500 shrink-0" />
                      ) : (
                        <FileText size={16} className="text-amber-600 shrink-0" />
                      )}
                      <span className="text-xs font-bold text-slate-700 truncate" title={att.title}>{att.title}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-emcn-blue hover:bg-white rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                        title="Abrir anexo"
                      >
                        <ExternalLink size={13} />
                      </a>
                      <button
                        onClick={() => handleDeleteDisciplineAttachment(att.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"
                        title="Excluir anexo"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Nenhum anexo geral cadastrado nesta matéria ainda. Clique no botão acima para incluir apostilas ou livros da disciplina.
              </p>
            )}
          </div>
        </div>

        {/* Lessons list */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-emcn-blue" size={36} /></div>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson, idx) => {
              const ytId = getYoutubeId(lesson.youtube_url);
              const hasAttachments = lesson.attachments && lesson.attachments.length > 0;
              return (
                <div key={lesson.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row items-stretch">
                    {/* Thumbnail */}
                    <div className="w-full sm:w-48 h-32 bg-slate-900 shrink-0 relative">
                      {ytId ? (
                        <img
                          src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                          alt={lesson.title}
                          className="w-full h-full object-cover opacity-90"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video size={32} className="text-slate-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                          <PlayCircle size={22} className="text-emcn-blue" />
                        </div>
                      </div>
                      <div className="absolute top-2 left-2 bg-emcn-blue text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        #{lesson.order_index}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-800 text-base">{lesson.title}</h3>
                          {lesson.lesson_date && (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Calendar size={10} /> {new Date(lesson.lesson_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          {hasAttachments && (
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                              <Paperclip size={10} /> {lesson.attachments?.length} {lesson.attachments?.length === 1 ? 'anexo' : 'anexos'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{lesson.description}</p>
                      </div>

                      {/* Display Lesson Attachments if present */}
                      {hasAttachments && (
                        <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                          {lesson.attachments?.map((att, attIdx) => (
                            <a
                              key={attIdx}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] bg-slate-100 hover:bg-emcn-blue hover:text-white text-slate-700 font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                            >
                              {att.type === 'IMAGE' ? <ImageIcon size={11} /> : <FileText size={11} />}
                              {att.title}
                              <ExternalLink size={10} className="ml-0.5" />
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                        <a
                          href={lesson.youtube_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-emcn-blue hover:underline flex items-center gap-1 font-medium"
                        >
                          <ExternalLink size={12} /> Ver no YouTube
                        </a>

                        <div className="flex items-center gap-3">
                          {/* CONTROLE DE ORDENAÇÃO: MOVER PARA CIMA / MOVER PARA BAIXO */}
                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                            <button
                              disabled={idx === 0}
                              onClick={() => handleMoveLessonOrder(idx, 'UP')}
                              className="p-1 text-slate-500 hover:text-emcn-blue disabled:opacity-20 disabled:hover:text-slate-500 rounded-lg hover:bg-white transition-colors"
                              title="Mover para Cima (Subir Posição)"
                            >
                              <ChevronUp size={16} />
                            </button>
                            <span className="text-[10px] font-bold text-slate-400 px-1 uppercase tracking-tighter">
                              #{lesson.order_index}
                            </span>
                            <button
                              disabled={idx === lessons.length - 1}
                              onClick={() => handleMoveLessonOrder(idx, 'DOWN')}
                              className="p-1 text-slate-500 hover:text-emcn-blue disabled:opacity-20 disabled:hover:text-slate-500 rounded-lg hover:bg-white transition-colors"
                              title="Mover para Baixo (Descer Posição)"
                            >
                              <ChevronDown size={16} />
                            </button>
                          </div>

                          <div className="flex gap-1.5 border-l border-slate-200 pl-3">
                            <button
                              onClick={() => { setLessonForm({ ...lesson, attachments: lesson.attachments || [] }); setShowLessonForm(true); }}
                              className="p-2 text-slate-400 hover:text-emcn-blue hover:bg-slate-50 rounded-xl transition-colors"
                              title="Editar Aula"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteLesson(lesson.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                              title="Excluir Aula"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {lessons.length === 0 && !loading && (
              <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100">
                <Video size={48} className="mx-auto mb-4 text-slate-200" />
                <p className="text-lg font-semibold text-slate-500">Nenhuma aula criada ainda.</p>
                <p className="text-sm text-slate-400 mt-1">Clique em "Nova Aula" para adicionar a primeira vídeo-aula.</p>
              </div>
            )}
          </div>
        )}

        {/* MODAL: ADICIONAR ANEXO À MATÉRIA */}
        {showDisciplineAttModal && (
          <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-emcn-gold p-6 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Adicionar Anexo à Matéria</h3>
                  <p className="text-xs text-white/80 mt-0.5">{getDisciplineName(selectedDisciplineId)} · {selectedClass.name}</p>
                </div>
                <button onClick={() => setShowDisciplineAttModal(false)} className="hover:bg-white/10 p-2 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveDisciplineAttachment} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Título do Anexo</label>
                  <input
                    required
                    value={discAttForm.title}
                    onChange={e => setDiscAttForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Ex: Apostila Geral de Homilética"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emcn-gold rounded-xl outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Tipo de Ficheiro</label>
                  <select
                    value={discAttForm.type}
                    onChange={e => setDiscAttForm(p => ({ ...p, type: e.target.value as any }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emcn-gold rounded-xl outline-none text-sm font-medium"
                  >
                    <option value="DOCUMENT">📄 Documento (PDF, Word, Drive, etc.)</option>
                    <option value="IMAGE">🖼️ Imagem (PNG, JPG, Esquema, etc.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Link / URL Externa do Anexo</label>
                  <input
                    type="url" required
                    value={discAttForm.url}
                    onChange={e => setDiscAttForm(p => ({ ...p, url: e.target.value }))}
                    placeholder="https://drive.google.com/... ou https://..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emcn-gold rounded-xl outline-none text-sm font-medium"
                  />
                </div>
                <div className="flex gap-4 pt-4 border-t">
                  <button type="button" onClick={() => setShowDisciplineAttModal(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" disabled={savingDiscAtt} className="flex-1 py-3 bg-emcn-gold text-white font-bold rounded-xl shadow-lg hover:bg-[#b08e4d] transition-colors flex items-center justify-center gap-2">
                    {savingDiscAtt ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Salvar Anexo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: LESSON FORM (NOVA / EDITAR AULA) */}
        {showLessonForm && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
              <div className="bg-emcn-blue p-6 text-white flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-xl font-bold">{lessonForm.id ? 'Editar Aula' : 'Nova Aula em Vídeo'}</h3>
                  <p className="text-xs text-white/60 mt-0.5">{getDisciplineName(selectedDisciplineId)} · {selectedClass.name}</p>
                </div>
                <button onClick={() => { setShowLessonForm(false); setLessonForm({ attachments: [] }); }} className="hover:bg-white/10 p-2 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveLesson} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Ordem</label>
                    <input
                      type="number" required min={1}
                      value={lessonForm.order_index || ''}
                      onChange={e => setLessonForm(p => ({ ...p, order_index: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emcn-gold rounded-xl outline-none"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Título da Aula</label>
                    <input
                      required
                      value={lessonForm.title || ''}
                      onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emcn-gold rounded-xl outline-none"
                      placeholder="Ex: Introdução à Homilética"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Data Lecionada</label>
                  <input
                    type="date" required
                    value={lessonForm.lesson_date || ''}
                    onChange={e => setLessonForm(p => ({ ...p, lesson_date: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emcn-gold rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Link YouTube</label>
                  <input
                    type="url" required
                    value={lessonForm.youtube_url || ''}
                    onChange={e => setLessonForm(p => ({ ...p, youtube_url: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emcn-gold rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Descrição / Resumo</label>
                  <textarea
                    required
                    value={lessonForm.description || ''}
                    onChange={e => setLessonForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emcn-gold rounded-xl outline-none h-20 resize-none"
                    placeholder="Breve resumo do conteúdo desta aula..."
                  />
                </div>

                {/* SECÇÃO: ANEXOS ESPECÍFICOS DA AULA */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Paperclip size={14} className="text-emcn-gold" /> Anexos Específicos desta Aula
                    </label>
                    <button
                      type="button"
                      onClick={handleAddLessonAttachment}
                      className="text-xs font-bold text-emcn-blue hover:underline flex items-center gap-1"
                    >
                      <Plus size={13} /> Add Anexo
                    </button>
                  </div>

                  {(lessonForm.attachments || []).length > 0 ? (
                    <div className="space-y-2.5">
                      {(lessonForm.attachments || []).map((att, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 relative">
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              required
                              placeholder="Título do anexo (ex: Slide Aula 1)"
                              value={att.title}
                              onChange={e => handleLessonAttachmentChange(idx, 'title', e.target.value)}
                              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-emcn-gold"
                            />
                            <select
                              value={att.type}
                              onChange={e => handleLessonAttachmentChange(idx, 'type', e.target.value as any)}
                              className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none"
                            >
                              <option value="DOCUMENT">📄 Documento</option>
                              <option value="IMAGE">🖼️ Imagem</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleRemoveLessonAttachment(idx)}
                              className="p-1 text-slate-400 hover:text-red-500 rounded-lg"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <input
                            type="url"
                            required
                            placeholder="Link/URL do arquivo (https://...)"
                            value={att.url}
                            onChange={e => handleLessonAttachmentChange(idx, 'url', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-emcn-gold"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Nenhum anexo adicionado a esta vídeo-aula especificamente.</p>
                  )}
                </div>

                <div className="flex gap-4 pt-4 border-t shrink-0">
                  <button type="button" onClick={() => { setShowLessonForm(false); setLessonForm({ attachments: [] }); }} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 bg-emcn-blue text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Salvar Aula
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── LEVEL 2: Disciplines of selected class ────────────────────────────────
  if (selectedClass) {
    const classDisciplines = getClassDisciplines(selectedClass);
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <button onClick={() => setSelectedClass(null)} className="hover:text-emcn-blue transition-colors font-medium">Turmas</button>
            <ChevronRight size={14} />
            <span className="text-slate-700 font-bold">{selectedClass.name}</span>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emcn-blue/10 rounded-2xl flex items-center justify-center">
                <GraduationCap className="text-emcn-blue" size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedClass.name}</h2>
                <p className="text-sm text-slate-500">{classDisciplines.length} disciplinas · Selecione para gerenciar as aulas EAD</p>
              </div>
            </div>
          </div>
        </div>

        {classDisciplines.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100">
            <BookOpen size={48} className="mx-auto mb-4 text-slate-200" />
            <p className="text-lg font-semibold text-slate-500">Nenhuma disciplina nesta turma.</p>
            <p className="text-sm text-slate-400 mt-1">Adicione aulas ao cronograma desta turma para as disciplinas aparecerem aqui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {classDisciplines.map((discipline, idx) => {
              const count = lessonCounts[discipline.id] || 0;
              return (
                <div
                  key={discipline.id}
                  className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 p-4"
                >
                  {/* Reorder Controls */}
                  <div className="flex flex-col items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0">
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMoveDisciplineOrder(classDisciplines, idx, 'UP')}
                      className="p-1 text-slate-500 hover:text-emcn-blue disabled:opacity-20 disabled:hover:text-slate-500 rounded-lg hover:bg-white transition-colors"
                      title="Mover Matéria para Cima"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <span className="text-[10px] font-black text-slate-400 leading-none">#{idx + 1}</span>
                    <button
                      disabled={idx === classDisciplines.length - 1}
                      onClick={() => handleMoveDisciplineOrder(classDisciplines, idx, 'DOWN')}
                      className="p-1 text-slate-500 hover:text-emcn-blue disabled:opacity-20 disabled:hover:text-slate-500 rounded-lg hover:bg-white transition-colors"
                      title="Mover Matéria para Baixo"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>

                  {/* Discipline Icon */}
                  <div className="w-12 h-12 bg-emcn-gold/10 rounded-2xl flex items-center justify-center shrink-0">
                    <BookOpen size={20} className="text-emcn-gold" />
                  </div>

                  {/* Discipline Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-base truncate">{discipline.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{discipline.description || 'Sem descrição'}</p>
                  </div>

                  {/* Count badge + Enter button */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${count > 0 ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400'}`}>
                      {count} {count === 1 ? 'aula' : 'aulas'}
                    </span>
                    <button
                      onClick={() => setSelectedDisciplineId(discipline.id)}
                      className="flex items-center gap-1.5 bg-emcn-blue hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
                    >
                      <Video size={13} /> Aulas <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── LEVEL 1: Classes list ─────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emcn-blue/10 rounded-2xl flex items-center justify-center">
            <Layers className="text-emcn-blue" size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">EAD — Aulas por Turma</h2>
            <p className="text-sm text-slate-500">Selecione uma turma para gerir as aulas em vídeo por disciplina.</p>
          </div>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100">
          <School size={48} className="mx-auto mb-4 text-slate-200" />
          <p className="text-lg font-semibold text-slate-500">Nenhuma turma criada ainda.</p>
          <p className="text-sm text-slate-400 mt-1">Crie turmas na secção "Escolas" para depois configurar o EAD.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map(cls => {
            const disciplineCount = new Set(cls.sessions.map(s => s.disciplineId)).size;
            return (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls)}
                className="bg-white rounded-2xl border shadow-sm hover:shadow-lg hover:border-emcn-blue/30 transition-all p-6 text-left group"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-14 h-14 bg-emcn-blue rounded-2xl flex items-center justify-center text-white font-black text-xl group-hover:bg-emcn-gold transition-colors">
                    {cls.name.charAt(0)}
                  </div>
                  <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-xs font-bold">
                    {cls.year}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-emcn-blue transition-colors">{cls.name}</h3>
                <p className="text-xs text-slate-500 mb-4">
                  {disciplineCount} {disciplineCount === 1 ? 'disciplina' : 'disciplinas'} no cronograma
                </p>
                <div className="flex items-center gap-1 text-xs text-emcn-blue font-bold group-hover:gap-2 transition-all">
                  <GraduationCap size={13} /> Ver Disciplinas <ChevronRight size={13} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EadAdminPage;
