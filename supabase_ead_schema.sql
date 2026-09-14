-- ===================================================
-- MIGRAÇÃO EAD: Ligar aulas a turmas e disciplinas
-- Execute este script no SQL Editor do Supabase
-- ===================================================

-- 1. Criar tabela ead_subjects se não existir
CREATE TABLE IF NOT EXISTS public.ead_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attachments JSONB DEFAULT '[]'::jsonb
);

-- 3. Adicionar colunas se tabela já existia previamente
ALTER TABLE public.ead_lessons
  ADD COLUMN IF NOT EXISTS class_id TEXT,
  ADD COLUMN IF NOT EXISTS discipline_id TEXT,
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- 4. Criar tabela ead_progress se não existir
CREATE TABLE IF NOT EXISTS public.ead_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES public.ead_lessons(id) ON DELETE CASCADE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, lesson_id)
);

-- 5. Criar tabela de anexos da matéria/disciplina por turma
CREATE TABLE IF NOT EXISTS public.ead_discipline_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id TEXT NOT NULL,
    discipline_id TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('DOCUMENT', 'IMAGE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Índices para melhorar a performance das queries
CREATE INDEX IF NOT EXISTS idx_ead_lessons_class_id ON public.ead_lessons(class_id);
CREATE INDEX IF NOT EXISTS idx_ead_lessons_discipline_id ON public.ead_lessons(discipline_id);
CREATE INDEX IF NOT EXISTS idx_ead_progress_student_id ON public.ead_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_ead_progress_lesson_id ON public.ead_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_ead_disc_att_class_disc ON public.ead_discipline_attachments(class_id, discipline_id);

-- 7. Habilitar Realtime com verificação de segurança (Evita erro 42710 "already member")
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'ead_lessons') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ead_lessons;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'ead_subjects') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ead_subjects;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'ead_progress') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ead_progress;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'ead_discipline_attachments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ead_discipline_attachments;
  END IF;
END $$;
