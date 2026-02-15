
-- SQL para criar as tabelas de Usuários e Permissões
-- Execute isso no SQL Editor do seu Supabase

-- 1. Tabela de Perfis (Sincronizada com Auth.Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'STUDENT',
    status TEXT DEFAULT 'ACTIVE',
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Permissões (RBAC)
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role TEXT NOT NULL,
    module TEXT NOT NULL,
    can_view BOOLEAN DEFAULT FALSE,
    can_create BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    UNIQUE(role, module)
);

-- 3. Inserir Permissões Iniciais para os Módulos
INSERT INTO public.permissions (role, module, can_view, can_create, can_edit, can_delete)
VALUES 
    ('ADMIN', 'DASHBOARD', true, true, true, true),
    ('ADMIN', 'STUDENTS', true, true, true, true),
    ('ADMIN', 'TEACHERS', true, true, true, true),
    ('ADMIN', 'CLASSES', true, true, true, true),
    ('ADMIN', 'ENROLLMENTS', true, true, true, true),
    ('ADMIN', 'SCHOOLS', true, true, true, true),
    ('ADMIN', 'CONFIG', true, true, true, true),
    
    ('SECRETARY', 'DASHBOARD', true, false, false, false),
    ('SECRETARY', 'STUDENTS', true, true, true, false),
    ('SECRETARY', 'ENROLLMENTS', true, true, true, false),
    ('SECRETARY', 'CLASSES', true, false, false, false)
ON CONFLICT (role, module) DO NOTHING;

-- 4. Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE permissions;
