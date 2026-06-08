-- ===================================================
-- MIGRAÇÃO EAD: Ligar aulas a turmas e disciplinas
-- Execute este script no SQL Editor do Supabase
-- ===================================================

-- 1. Adicionar colunas class_id e discipline_id à tabela ead_lessons
ALTER TABLE public.ead_lessons
  ADD COLUMN IF NOT EXISTS class_id TEXT,
  ADD COLUMN IF NOT EXISTS discipline_id TEXT;

-- 2. Criar tabela ead_lessons se ainda não existir (fresh install)
CREATE TABLE IF NOT EXISTS public.ead_lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES public.ead_subjects(id) ON DELETE SET NULL,
    class_id TEXT,
    discipline_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    youtube_url TEXT NOT NULL,
    cover_image_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela ead_subjects se não existir
CREATE TABLE IF NOT EXISTS public.ead_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela ead_progress se não existir
CREATE TABLE IF NOT EXISTS public.ead_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES public.ead_lessons(id) ON DELETE CASCADE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, lesson_id)
);

-- 5. Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE ead_lessons;
ALTER PUBLICATION supabase_realtime ADD TABLE ead_subjects;
ALTER PUBLICATION supabase_realtime ADD TABLE ead_progress;

-- 6. Índices para melhorar a performance das queries por turma/disciplina
CREATE INDEX IF NOT EXISTS idx_ead_lessons_class_id ON public.ead_lessons(class_id);
CREATE INDEX IF NOT EXISTS idx_ead_lessons_discipline_id ON public.ead_lessons(discipline_id);
CREATE INDEX IF NOT EXISTS idx_ead_progress_student_id ON public.ead_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_ead_progress_lesson_id ON public.ead_progress(lesson_id);
