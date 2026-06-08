-- Migration to add Municipalities (Municípios) into the location hierarchy
-- Hierarchy: Country (País) -> Province (Província) -> Municipality (Município) -> Commune (Comuna)

-- 1. Create municipalities table
CREATE TABLE IF NOT EXISTS public.municipalities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    province_id UUID REFERENCES public.provinces(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add municipality_id to students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS municipality_id UUID REFERENCES public.municipalities(id) ON DELETE SET NULL;

-- 3. Modify communes to link to municipalities
ALTER TABLE public.communes
  ADD COLUMN IF NOT EXISTS municipality_id UUID REFERENCES public.municipalities(id) ON DELETE CASCADE,
  ALTER COLUMN province_id DROP NOT NULL;

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_municipalities_province_id ON public.municipalities(province_id);
CREATE INDEX IF NOT EXISTS idx_communes_municipality_id ON public.communes(municipality_id);
CREATE INDEX IF NOT EXISTS idx_students_municipality_id ON public.students(municipality_id);

-- 5. Enable Realtime support for municipalities
ALTER PUBLICATION supabase_realtime ADD TABLE public.municipalities;

-- 6. Disable Row Level Security (RLS) on municipalities to allow insertion/reads
-- (If you want to keep RLS active, create appropriate SELECT/INSERT/UPDATE/DELETE policies instead)
ALTER TABLE public.municipalities DISABLE ROW LEVEL SECURITY;

-- 7. Seed Luanda's municipalities dynamically
DO $$
DECLARE
    luanda_id UUID;
BEGIN
    SELECT id INTO luanda_id FROM public.provinces WHERE name = 'Luanda' LIMIT 1;
    IF luanda_id IS NOT NULL THEN
        INSERT INTO public.municipalities (province_id, name) VALUES
            (luanda_id, 'Luanda'),
            (luanda_id, 'Belas'),
            (luanda_id, 'Cacuaco'),
            (luanda_id, 'Cazenga'),
            (luanda_id, 'Icolo e Bengo'),
            (luanda_id, 'Quiçama'),
            (luanda_id, 'Talatona'),
            (luanda_id, 'Viana'),
            (luanda_id, 'Kilamba Kiaxi')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
