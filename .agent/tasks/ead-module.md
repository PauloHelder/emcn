# Plano de Implementação: Módulo EAD (Cursos e Aulas)

## 1. Banco de Dados (Supabase)
Precisaremos criar três novas tabelas no banco de dados para suportar a área de EAD:

### Tabela `ead_subjects` (Matérias/Cursos)
- `id` (uuid, primary key)
- `title` (text)
- `description` (text)
- `cover_image_url` (text)
- `status` (text: ACTIVE, INACTIVE)
- `created_at` (timestamp)

### Tabela `ead_lessons` (Aulas)
- `id` (uuid, primary key)
- `subject_id` (uuid, foreign key to ead_subjects)
- `title` (text)
- `description` (text)
- `youtube_url` (text)
- `cover_image_url` (text)
- `order_index` (integer) - para manter a ordem das aulas
- `created_at` (timestamp)

### Tabela `ead_progress` (Progresso do Aluno)
- `id` (uuid, primary key)
- `student_id` (uuid, foreign key to students)
- `lesson_id` (uuid, foreign key to ead_lessons)
- `completed_at` (timestamp)

## 2. Tipagem (`types.ts`)
Adicionar as interfaces correspondentes:
```typescript
export interface EadSubject {
  id: string;
  title: string;
  description: string;
  cover_image_url?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface EadLesson {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  youtube_url: string;
  cover_image_url?: string;
  order_index: number;
  created_at: string;
}

export interface EadProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  completed_at: string;
}
```

## 3. Telas e Componentes (Frontend)

### Área Administrativa (`pages/EadAdminPage.tsx`)
- **Acesso:** Perfil `ADMIN` e `TEACHER`.
- **Funcionalidades:** 
  - Listagem de Matérias (Cursos).
  - Modal para criar/editar Matéria (com campo para URL da capa).
  - Ao clicar em uma Matéria, abre o gerenciador de Aulas.
  - Modal para criar/editar Aula (com URL do YouTube e URL da capa da aula).
  - Listagem dos alunos que assistiram/concluíram (aba de "Relatórios/Progresso").

### Área do Aluno (`pages/StudentEadPage.tsx`)
- **Acesso:** Perfil `STUDENT`.
- Esta tela pode ser uma sub-rota dentro da `StudentArea` ou acessada a partir da dashboard do aluno.
- **Funcionalidades:**
  - Grade de Matérias disponíveis exibindo as "capas" (cover_image_url).
  - Ao clicar em uma Matéria, abre a lista de Aulas.
  - Ao clicar numa Aula, exibe o vídeo do YouTube embutido (iframe).
  - Botão de ação: "✅ Marcar como Concluído" / "Desmarcar conclusão".

## 4. Integração de Rotas (`App.tsx`)
- Adicionar ícone de "EAD / Aulas" na barra lateral (Sidebar).
- Criar a rota privada `/ead-admin` para gestão.
- Incorporar visualização de aulas na rota do aluno.

## Próximos Passos (Fases de Implementação):
1. **Fase 1:** Atualizar Tipos e Criar as tabelas no Supabase.
2. **Fase 2:** Construir a tela `EadAdminPage.tsx` para os gestores.
3. **Fase 3:** Construir a tela/módulo do aluno para consumir os vídeos.
4. **Fase 4:** Testar permissões (Professor vs Admin) e salvar progressos.
