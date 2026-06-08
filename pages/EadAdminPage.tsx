import React, { useState, useEffect } from 'react';
import { EadLesson, ClassGroup, Discipline } from '../types';
import { supabase } from '../supabase';
import {
  BookOpen, Video, Plus, Edit, Trash2, ArrowLeft, Loader2, Save, X,
  ExternalLink, School, ChevronRight, PlayCircle, GraduationCap, Layers, Calendar
} from 'lucide-react';

interface EadAdminPageProps {
  classes: ClassGroup[];
  disciplines: Discipline[];
}

const EadAdminPage: React.FC<EadAdminPageProps> = ({ classes, disciplines }) => {
  // Navigation state: Class → Discipline → Lessons
  const [selectedClass, setSelectedClass] = useState<ClassGroup | null>(null);
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string | null>(null);

  // Lesson data
  const [lessons, setLessons] = useState<EadLesson[]>([]);
  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // Lesson form
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonForm, setLessonForm] = useState<Partial<EadLesson>>({});
  const [saving, setSaving] = useState(false);

  // Fetch lesson counts for all class+discipline combos when a class is selected
  useEffect(() => {
    if (!selectedClass) return;
    fetchLessonCounts(selectedClass.id);
  }, [selectedClass?.id]);

  // Fetch lessons when a discipline is selected
  useEffect(() => {
    if (!selectedClass || !selectedDisciplineId) return;
    fetchLessons(selectedClass.id, selectedDisciplineId);
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
      .order('order_index', { ascending: true });
    if (!error && data) setLessons(data);
    setLoading(false);
  };

  // Get unique discipline IDs used in this class's sessions
  const getClassDisciplines = (cls: ClassGroup): Discipline[] => {
    const ids = new Set(cls.sessions.map(s => s.disciplineId));
    return disciplines.filter(d => ids.has(d.id));
  };

  const getDisciplineName = (id: string) => disciplines.find(d => d.id === id)?.name || 'Desconhecida';

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedDisciplineId) return;
    setSaving(true);
    try {
      const payload = {
        class_id: selectedClass.id,
        discipline_id: selectedDisciplineId,
        title: lessonForm.title,
        description: lessonForm.description,
        youtube_url: lessonForm.youtube_url,
        cover_image_url: lessonForm.cover_image_url || null,
        order_index: lessonForm.order_index || lessons.length + 1,
        lesson_date: lessonForm.lesson_date || null,
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
      setLessonForm({});
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
              onClick={() => { setLessonForm({ order_index: lessons.length + 1, lesson_date: new Date().toISOString().split('T')[0] }); setShowLessonForm(true); }}
              className="bg-emcn-blue text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg shadow-emcn-blue/20"
            >
              <Plus size={18} /> Nova Aula
            </button>
          </div>
        </div>

        {/* Lessons list */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-emcn-blue" size={36} /></div>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson, idx) => {
              const ytId = getYoutubeId(lesson.youtube_url);
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
                        </div>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{lesson.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                        <a
                          href={lesson.youtube_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-emcn-blue hover:underline flex items-center gap-1 font-medium"
                        >
                          <ExternalLink size={12} /> Ver no YouTube
                        </a>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setLessonForm(lesson); setShowLessonForm(true); }}
                            className="p-2 text-slate-400 hover:text-emcn-blue hover:bg-slate-50 rounded-xl transition-colors"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
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

        {/* LESSON MODAL */}
        {showLessonForm && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-emcn-blue p-6 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">{lessonForm.id ? 'Editar Aula' : 'Nova Aula em Vídeo'}</h3>
                  <p className="text-xs text-white/60 mt-0.5">{getDisciplineName(selectedDisciplineId)} · {selectedClass.name}</p>
                </div>
                <button onClick={() => { setShowLessonForm(false); setLessonForm({}); }} className="hover:bg-white/10 p-2 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveLesson} className="p-6 space-y-4">
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
                <div className="flex gap-4 pt-4 border-t">
                  <button type="button" onClick={() => { setShowLessonForm(false); setLessonForm({}); }} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {classDisciplines.map(discipline => {
              const count = lessonCounts[discipline.id] || 0;
              return (
                <button
                  key={discipline.id}
                  onClick={() => setSelectedDisciplineId(discipline.id)}
                  className="bg-white rounded-2xl border shadow-sm hover:shadow-lg hover:border-emcn-gold/30 transition-all p-6 text-left group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-emcn-gold/10 rounded-2xl flex items-center justify-center group-hover:bg-emcn-gold group-hover:text-white transition-colors">
                      <BookOpen size={20} className="text-emcn-gold group-hover:text-white transition-colors" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${count > 0 ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400'}`}>
                      {count} {count === 1 ? 'aula' : 'aulas'}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-base mb-1 group-hover:text-emcn-blue transition-colors">{discipline.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{discipline.description || 'Sem descrição'}</p>
                  <div className="flex items-center gap-1 mt-4 text-xs text-emcn-gold font-bold group-hover:gap-2 transition-all">
                    <Video size={13} /> Gerenciar Aulas <ChevronRight size={13} />
                  </div>
                </button>
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
